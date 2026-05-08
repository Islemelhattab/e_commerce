import React, { useState, useEffect } from 'react';
import { hrAPI } from '../../services/erpApi';
import { StatCard, Badge, SectionHeader, Table, Btn, Card, Modal, Field, inputStyle, Spinner, fmt, fmtDate, C } from '../../components/erp/ErpUI';
import toast from 'react-hot-toast';

// ═══════════════════════════════════════════════════════════
//  EMPLOYEES PAGE
// ═══════════════════════════════════════════════════════════
export function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [detail, setDetail] = useState(null);
  const [statusFilter, setStatusFilter] = useState('active');
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '', cin: '',
    department: '', job_title: '', contract_type: 'cdi',
    hire_date: '', base_salary: '', cnss_number: '', bank_account: '',
  });

  const load = () => {
    setLoading(true);
    Promise.all([hrAPI.getEmployees({ status: statusFilter || undefined }), hrAPI.getDepartments()])
      .then(([e, d]) => {
        setEmployees(e.data.results || e.data);
        setDepartments(d.data.results || d.data);
      }).finally(() => setLoading(false));
  };
  useEffect(load, [statusFilter]);

  const save = async () => {
    try {
      await hrAPI.createEmployee(form);
      toast.success('Employé créé');
      setModal(false);
      setForm({ first_name: '', last_name: '', email: '', phone: '', cin: '', department: '', job_title: '', contract_type: 'cdi', hire_date: '', base_salary: '', cnss_number: '', bank_account: '' });
      load();
    } catch (e) {
      const err = e.response?.data;
      toast.error(err?.email?.[0] || err?.cin?.[0] || 'Erreur création');
    }
  };

  const active      = employees.filter(e => e.status === 'active').length;
  const terminated  = employees.filter(e => e.status === 'terminated').length;
  const totalSalary = employees.filter(e => e.status === 'active').reduce((s, e) => s + parseFloat(e.base_salary || 0), 0);

  const contractLabel = { cdi: 'CDI', cdd: 'CDD', interim: 'Intérim', freelance: 'Freelance' };

  return (
    <div>
      <SectionHeader
        title="Employés"
        subtitle={`${active} employés actifs`}
        action={<Btn onClick={() => setModal(true)}>+ Nouvel employé</Btn>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Employés actifs" value={active} color={C.green}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>} />
        <StatCard label="Contrats terminés" value={terminated} color={C.red}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>} />
        <StatCard label="Masse salariale brute" value={`${totalSalary.toFixed(3)} TND`} color={C.blue}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>} />
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {[['active', 'Actifs'], ['suspended', 'Suspendus'], ['terminated', 'Terminés'], ['', 'Tous']].map(([v, l]) => (
          <button key={v} onClick={() => setStatusFilter(v)} style={{
            padding: '6px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600,
            background: statusFilter === v ? C.navy : C.grayLt,
            color: statusFilter === v ? 'white' : C.gray, border: 'none', cursor: 'pointer',
          }}>{l}</button>
        ))}
      </div>

      {loading ? <Spinner /> : (
        <Table
          onRowClick={setDetail}
          emptyMessage="Aucun employé."
          columns={[
            { key: 'employee_id',    label: 'ID' },
            { key: 'full_name',      label: 'Nom complet' },
            { key: 'department_name',label: 'Département' },
            { key: 'job_title',      label: 'Poste' },
            { key: 'contract_type',  label: 'Contrat', render: v => contractLabel[v] || v },
            { key: 'base_salary',    label: 'Salaire brut', render: fmt },
            { key: 'hire_date',      label: 'Embauche', render: fmtDate },
            { key: 'status',         label: 'Statut', render: v => <Badge status={v} label={v === 'active' ? 'Actif' : v === 'terminated' ? 'Terminé' : v} /> },
          ]}
          data={employees}
        />
      )}

      {/* Create Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Nouvel employé" width={560}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[['first_name','Prénom',true],['last_name','Nom',true]].map(([k,l,r]) => (
            <Field key={k} label={l} required={r}>
              <input value={form[k]} onChange={e => setForm(f => ({...f, [k]: e.target.value}))} style={inputStyle} />
            </Field>
          ))}
        </div>
        {[['email','Email','email',true],['phone','Téléphone','text'],['cin','CIN','text',true],['job_title','Intitulé du poste','text',true]].map(([k,l,t,r]) => (
          <Field key={k} label={l} required={r}>
            <input type={t||'text'} value={form[k]} onChange={e => setForm(f => ({...f, [k]: e.target.value}))} style={inputStyle} />
          </Field>
        ))}
        <Field label="Département">
          <select value={form.department} onChange={e => setForm(f => ({...f, department: e.target.value}))} style={inputStyle}>
            <option value="">Sélectionner</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Type de contrat" required>
            <select value={form.contract_type} onChange={e => setForm(f => ({...f, contract_type: e.target.value}))} style={inputStyle}>
              {[['cdi','CDI'],['cdd','CDD'],['interim','Intérim'],['freelance','Freelance']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          <Field label="Date d'embauche" required>
            <input type="date" value={form.hire_date} onChange={e => setForm(f => ({...f, hire_date: e.target.value}))} style={inputStyle} />
          </Field>
        </div>
        <Field label="Salaire brut mensuel (TND)" required>
          <input type="number" step="0.001" value={form.base_salary} onChange={e => setForm(f => ({...f, base_salary: e.target.value}))} style={inputStyle} />
        </Field>
        {[['cnss_number','Numéro CNSS'],['bank_account','RIB bancaire']].map(([k,l]) => (
          <Field key={k} label={l}>
            <input value={form[k]} onChange={e => setForm(f => ({...f, [k]: e.target.value}))} style={inputStyle} />
          </Field>
        ))}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
          <Btn variant="secondary" onClick={() => setModal(false)}>Annuler</Btn>
          <Btn onClick={save}>Enregistrer</Btn>
        </div>
      </Modal>

      {/* Detail modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={`Employé — ${detail?.full_name}`} width={560}>
        {detail && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              ['ID', detail.employee_id], ['Poste', detail.job_title],
              ['Département', detail.department_name], ['Contrat', contractLabel[detail.contract_type]],
              ['Email', detail.email], ['Téléphone', detail.phone],
              ['Date embauche', fmtDate(detail.hire_date)], ['Salaire brut', fmt(detail.base_salary)],
              ['Statut', <Badge status={detail.status} />],
            ].map(([l, v]) => (
              <div key={l} style={{ background: C.grayLt, padding: '10px 14px', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: C.gray, fontWeight: 600, marginBottom: 2 }}>{l}</div>
                <div style={{ fontSize: 13, color: C.text }}>{v || '—'}</div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  LEAVE REQUESTS PAGE
// ═══════════════════════════════════════════════════════════
export function LeavesPage() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  const load = () => {
    setLoading(true);
    hrAPI.getLeaves(filter ? { status: filter } : {})
      .then(r => setLeaves(r.data.results || r.data))
      .finally(() => setLoading(false));
  };
  useEffect(load, [filter]);

  const action = async (fn, label) => {
    try { await fn(); toast.success(label); load(); }
    catch (e) { toast.error(e.response?.data?.error || 'Erreur'); }
  };

  const typeLabel = { annual: 'Congé annuel', sick: 'Maladie', maternity: 'Maternité', unpaid: 'Sans solde', other: 'Autre' };

  return (
    <div>
      <SectionHeader title="Demandes de Congé" subtitle="Validation des absences et congés" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="En attente" value={leaves.filter(l => l.status === 'pending').length} color={C.orange} />
        <StatCard label="Approuvées" value={leaves.filter(l => l.status === 'approved').length} color={C.green} />
        <StatCard label="Refusées" value={leaves.filter(l => l.status === 'rejected').length} color={C.red} />
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {[['pending', 'En attente'], ['approved', 'Approuvées'], ['rejected', 'Refusées'], ['', 'Toutes']].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} style={{
            padding: '6px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600,
            background: filter === v ? C.navy : C.grayLt,
            color: filter === v ? 'white' : C.gray, border: 'none', cursor: 'pointer',
          }}>{l}</button>
        ))}
      </div>

      {loading ? <Spinner /> : (
        <Table
          emptyMessage="Aucune demande de congé."
          columns={[
            { key: 'employee_name', label: 'Employé' },
            { key: 'leave_type',    label: 'Type', render: v => typeLabel[v] || v },
            { key: 'start_date',    label: 'Début', render: fmtDate },
            { key: 'end_date',      label: 'Fin',   render: fmtDate },
            { key: 'days',          label: 'Jours', render: v => `${v}j` },
            { key: 'status',        label: 'Statut', render: v => <Badge status={v} label={v === 'pending' ? 'En attente' : v === 'approved' ? 'Approuvé' : v === 'rejected' ? 'Refusé' : v} /> },
            { key: 'id',            label: 'Actions', render: (id, row) => (
              row.status === 'pending' ? (
                <div style={{ display: 'flex', gap: 6 }}>
                  <Btn size="sm" variant="success" onClick={e => { e.stopPropagation(); action(() => hrAPI.approveLeave(id), 'Congé approuvé'); }}>✓ Approuver</Btn>
                  <Btn size="sm" variant="danger"  onClick={e => { e.stopPropagation(); action(() => hrAPI.rejectLeave(id), 'Congé refusé'); }}>✕ Refuser</Btn>
                </div>
              ) : <span style={{ fontSize: 12, color: C.gray }}>Traité</span>
            )},
          ]}
          data={leaves}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  PAYROLL PAGE
// ═══════════════════════════════════════════════════════════
export function PayrollPage() {
  const [payrolls, setPayrolls] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [generating, setGenerating] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      hrAPI.getPayrolls({ period_month: month, period_year: year }),
      hrAPI.getSummary({ month, year }),
    ]).then(([p, s]) => {
      setPayrolls(p.data.results || p.data);
      setSummary(s.data);
    }).finally(() => setLoading(false));
  };
  useEffect(load, [month, year]);

  const generateBatch = async () => {
    setGenerating(true);
    try {
      const r = await hrAPI.generateBatch({ month, year });
      toast.success(`${r.data.created.length} fiche(s) générée(s)`);
      load();
    } catch (e) { toast.error('Erreur génération'); }
    finally { setGenerating(false); }
  };

  const action = async (fn, label) => {
    try { await fn(); toast.success(label); load(); }
    catch (e) { toast.error(e.response?.data?.error || 'Erreur'); }
  };

  const months = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

  return (
    <div>
      <SectionHeader
        title="Paie"
        subtitle={`${months[month - 1]} ${year}`}
        action={
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <select value={month} onChange={e => setMonth(+e.target.value)} style={{ ...inputStyle, width: 130 }}>
              {months.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
            </select>
            <input type="number" value={year} onChange={e => setYear(+e.target.value)} style={{ ...inputStyle, width: 90 }} min={2020} max={2099} />
            <Btn variant="teal" onClick={generateBatch} disabled={generating}>
              {generating ? '...' : '⚡ Générer la paie du mois'}
            </Btn>
          </div>
        }
      />

      {/* Summary cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 24 }}>
          <StatCard label="Employés payés" value={summary.count || 0} color={C.blue} />
          <StatCard label="Total brut" value={`${parseFloat(summary.total_gross || 0).toFixed(3)}`} color={C.navy} />
          <StatCard label="CNSS (salarié)" value={`${parseFloat(summary.total_cnss_employee || 0).toFixed(3)}`} color={C.orange} />
          <StatCard label="IRPP total" value={`${parseFloat(summary.total_irpp || 0).toFixed(3)}`} color={C.red} />
          <StatCard label="Total Net" value={`${parseFloat(summary.total_net || 0).toFixed(3)} TND`} color={C.green} />
        </div>
      )}

      {loading ? <Spinner /> : (
        <Table
          emptyMessage={`Aucune fiche de paie pour ${months[month-1]} ${year}. Cliquez sur "Générer".`}
          columns={[
            { key: 'employee_name', label: 'Employé' },
            { key: 'base_salary',   label: 'Salaire base', render: fmt },
            { key: 'bonus',         label: 'Prime',        render: fmt },
            { key: 'gross_salary',  label: 'Brut',         render: fmt },
            { key: 'cnss_employee', label: 'CNSS (9.18%)', render: fmt },
            { key: 'irpp',          label: 'IRPP',         render: fmt },
            { key: 'net_salary',    label: 'Net à payer',  render: v => <strong style={{ color: C.green }}>{fmt(v)}</strong> },
            { key: 'status',        label: 'Statut', render: v => <Badge status={v} label={v === 'draft' ? 'Brouillon' : v === 'validated' ? 'Validée' : 'Payée'} /> },
            { key: 'id',            label: 'Actions', render: (id, row) => (
              <div style={{ display: 'flex', gap: 6 }}>
                {row.status === 'draft' && (
                  <Btn size="sm" variant="teal" onClick={e => { e.stopPropagation(); action(() => hrAPI.validatePayroll(id), 'Fiche validée'); }}>
                    Valider
                  </Btn>
                )}
                {row.status === 'validated' && (
                  <Btn size="sm" variant="success" onClick={e => { e.stopPropagation(); action(() => hrAPI.payPayroll(id), 'Paie enregistrée + écriture comptable'); }}>
                    Payer
                  </Btn>
                )}
                {row.status === 'paid' && <span style={{ fontSize: 12, color: C.green }}>✓ Payée</span>}
              </div>
            )},
          ]}
          data={payrolls}
        />
      )}
    </div>
  );
}
