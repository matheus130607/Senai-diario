import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.106.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const jsonResponse = (body: Record<string, unknown>, status = 200) => new Response(
  JSON.stringify(body),
  {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  },
);

const parseSecretKeys = () => {
  try {
    return JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}');
  } catch {
    return {};
  }
};

const serviceRoleKey = () => {
  const secretKeys = parseSecretKeys();
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    || secretKeys.service_role
    || secretKeys.default
    || '';
};

const toDateKey = (date: Date) => date.toISOString().slice(0, 10);

const addDays = (date: Date, amount: number) => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + amount);
  return next;
};

const previousWeekRange = () => {
  const end = new Date();
  end.setUTCHours(0, 0, 0, 0);
  const start = addDays(end, -7);

  return {
    startDate: toDateKey(start),
    endDate: toDateKey(addDays(end, -1)),
  };
};

const nextMondayAtFive = (base: Date) => {
  const next = new Date(base);
  const day = next.getUTCDay();
  const daysUntilMonday = (8 - day) % 7 || 7;
  next.setUTCDate(next.getUTCDate() + daysUntilMonday);
  next.setUTCHours(8, 0, 0, 0);
  return next;
};

const resolveNextRunAt = (periodicity: string) => {
  const now = new Date();

  if (periodicity === 'daily_0700') {
    const next = addDays(now, 1);
    next.setUTCHours(10, 0, 0, 0);
    return next.toISOString();
  }

  if (periodicity === 'monthly_first_0600') {
    const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 9, 0, 0));
    return next.toISOString();
  }

  if (periodicity === 'manual') return null;

  return nextMondayAtFive(now).toISOString();
};

const buildRecipients = async (supabase: ReturnType<typeof createClient>, template: string) => {
  if (template === 'coordination-digest') {
    const { data, error } = await supabase
      .from('administradores')
      .select('nome,email,perfil')
      .in('perfil', ['coordenacao', 'secretaria']);

    if (error) throw error;

    return (data || [])
      .filter((admin) => admin.email)
      .map((admin) => ({
        type: admin.perfil || 'coordenacao',
        name: admin.nome,
        email: admin.email,
      }));
  }

  const [{ data: empresas, error: empresasError }, { data: alunos, error: alunosError }] = await Promise.all([
    supabase.from('empresas').select('id,nome,email'),
    supabase.from('alunos').select('id,nome,empresa_id'),
  ]);

  if (empresasError) throw empresasError;
  if (alunosError) throw alunosError;

  const activeCompanyIds = new Set((alunos || []).map((aluno) => aluno.empresa_id).filter(Boolean));

  return (empresas || [])
    .filter((empresa) => empresa.email && activeCompanyIds.has(empresa.id))
    .map((empresa) => ({
      type: 'empresa',
      id: empresa.id,
      name: empresa.nome,
      email: empresa.email,
      alunos: (alunos || []).filter((aluno) => aluno.empresa_id === empresa.id),
    }));
};

const buildMetrics = async (supabase: ReturnType<typeof createClient>) => {
  const { startDate, endDate } = previousWeekRange();
  const { data, error } = await supabase
    .from('presencas')
    .select('status,atraso,data,aluno_id')
    .gte('data', startDate)
    .lte('data', endDate);

  if (error) throw error;

  const presencas = data || [];
  const presentes = presencas.filter((item) => item.status === 'presente' || item.status === 'Presente').length;
  const faltas = presencas.filter((item) => item.status === 'falta' || item.status === 'Faltou').length;
  const atrasos = presencas.filter((item) => item.atraso).length;
  const total = presentes + faltas;

  return {
    startDate,
    endDate,
    presentes,
    faltas,
    atrasos,
    total,
    frequencia: total === 0 ? 0 : Math.round((presentes / total) * 100),
  };
};

const sendToProvider = async (payload: Record<string, unknown>) => {
  const providerUrl = Deno.env.get('EMAIL_PROVIDER_WEBHOOK_URL');
  const providerToken = Deno.env.get('EMAIL_PROVIDER_TOKEN');

  if (!providerUrl) {
    throw new Error('EMAIL_PROVIDER_WEBHOOK_URL nao configurada.');
  }

  const response = await fetch(providerUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(providerToken ? { Authorization: `Bearer ${providerToken}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Provider respondeu ${response.status}: ${message.slice(0, 240)}`);
  }
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const cronToken = Deno.env.get('EMAIL_AUTOMATION_CRON_TOKEN');
  const bearerToken = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') || '';

  if (!cronToken) {
    return jsonResponse({ error: 'EMAIL_AUTOMATION_CRON_TOKEN nao configurado.' }, 500);
  }

  if (bearerToken !== cronToken) {
    return jsonResponse({ error: 'Nao autorizado.' }, 401);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const key = serviceRoleKey();

  if (!supabaseUrl || !key) {
    return jsonResponse({ error: 'SUPABASE_URL ou chave server-side ausente.' }, 500);
  }

  const supabase = createClient(supabaseUrl, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: automations, error } = await supabase
    .from('email_automations')
    .select('*')
    .eq('status', 'active');

  if (error) {
    return jsonResponse({ error: error.message }, 500);
  }

  const dueAutomations = (automations || []).filter((automation) => (
    !automation.next_run_at || new Date(automation.next_run_at) <= new Date()
  ));

  const results = [];

  for (const automation of dueAutomations) {
    const startedAt = new Date().toISOString();
    const automationName = automation.name || 'Comunicado automatico';

    try {
      const [recipients, metrics] = await Promise.all([
        buildRecipients(supabase, automation.template),
        buildMetrics(supabase),
      ]);

      await sendToProvider({
        automation: {
          id: automation.id,
          clientId: automation.client_id,
          name: automationName,
          template: automation.template,
          subject: automation.subject,
        },
        recipients,
        metrics,
      });

      const finishedAt = new Date().toISOString();
      await supabase.from('email_automation_logs').insert({
        client_id: `${automation.client_id || automation.id}-${Date.now()}`,
        automation_id: automation.id,
        automation_client_id: automation.client_id,
        automation_name: automationName,
        status: 'success',
        recipients: recipients.length,
        attempts: 1,
        message: 'Envio confirmado pelo provider configurado.',
        started_at: startedAt,
        finished_at: finishedAt,
      });

      await supabase
        .from('email_automations')
        .update({
          next_run_at: resolveNextRunAt(automation.periodicity),
          updated_at: finishedAt,
        })
        .eq('id', automation.id);

      results.push({ id: automation.id, status: 'success', recipients: recipients.length });
    } catch (sendError) {
      const finishedAt = new Date().toISOString();
      const message = sendError instanceof Error ? sendError.message : String(sendError);

      await supabase.from('email_automation_logs').insert({
        client_id: `${automation.client_id || automation.id}-${Date.now()}`,
        automation_id: automation.id,
        automation_client_id: automation.client_id,
        automation_name: automationName,
        status: 'failed',
        recipients: 0,
        attempts: 1,
        message,
        started_at: startedAt,
        finished_at: finishedAt,
      });

      results.push({ id: automation.id, status: 'failed', message });
    }
  }

  return jsonResponse({
    processed: dueAutomations.length,
    results,
  });
});
