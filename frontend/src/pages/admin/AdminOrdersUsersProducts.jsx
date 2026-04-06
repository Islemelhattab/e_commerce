import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminOrdersAPI, adminUsersAPI, adminProductsAPI } from '../../services/adminApi';
import { PageHeader, Card, DataTable, StatusBadge, Btn, SearchInput, Modal, Input, Select, Tabs, useConfirm } from '../../components/admin/AdminUI';

const fmt = (n) => parseFloat(n || 0).toFixed(3);


// ==================== ORDERS PAGE ====================
const ORDER_STATUS_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'pending', label: 'En attente' },
  { value: 'confirmed', label: 'Confirmée' },
  { value: 'processing', label: 'En traitement' },
  { value: 'shipped', label: 'Expédiée' },
  { value: 'delivered', label: 'Livrée' },
  { value: 'cancelled', label: 'Annulée' },
  { value: 'return_requested', label: 'Retour demandé' },
];

const UPDATE_STATUS_OPTIONS = [
  { value: 'pending', label: 'En attente' },
  { value: 'confirmed', label: 'Confirmée' },
  { value: 'processing', label: 'En traitement' },
  { value: 'shipped', label: 'Expédiée' },
  { value: 'out_for_delivery', label: 'En livraison' },
  { value: 'delivered', label: 'Livrée' },
  { value: 'cancelled', label: 'Annulée' },
];

export function AdminOrdersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updateForm, setUpdateForm] = useState({ status: '', comment: '', tracking_number: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', search, statusFilter],
    queryFn: () => adminOrdersAPI.list({ search, status: statusFilter }).then(r => r.data.results || r.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminOrdersAPI.updateStatus(id, data),
    onSuccess: () => { toast.success('Statut mis à jour'); qc.invalidateQueries(['admin-orders']); setSelectedOrder(null); },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  const cols = [
    { key: 'order_number', label: 'N° commande', render: (v) => <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 12 }}>{v}</span> },
    { key: 'user_name', label: 'Client' },
    { key: 'user_email', label: 'Email', render: (v) => <span style={{ color: '#9090A8', fontSize: 12 }}>{v}</span> },
    { key: 'items_count', label: 'Articles', render: (v) => <span style={{ color: '#9090A8' }}>{v}</span> },
    { key: 'total', label: 'Total', render: (v) => <strong>{fmt(v)} DT</strong> },
    { key: 'payment_status', label: 'Paiement', render: (v) => <StatusBadge status={v} /> },
    { key: 'status', label: 'Statut', render: (v) => <StatusBadge status={v} /> },
    { key: 'created_at', label: 'Date', render: (v) => new Date(v).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) },
    { key: '_actions', label: '', render: (_, row) => (
      <div style={{ display: 'flex', gap: 6 }}>
        <Btn size="sm" variant="outline" onClick={() => { setSelectedOrder(row); setUpdateForm({ status: row.status, comment: '', tracking_number: row.tracking_number || '' }); }}>Modifier</Btn>
        <Btn size="sm" variant="ghost" onClick={() => window.open(`${process.env.REACT_APP_API_URL?.replace('/api','')}/api/admin/orders/${row.id}/export_pdf/`, '_blank')}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </Btn>
      </div>
    )},
  ];

  return (
    <div>
      <PageHeader title="Commandes" subtitle={`${data?.length || 0} commandes`}
        actions={
          <a href={adminOrdersAPI.exportCsv()} download>
            <Btn variant="outline" size="sm">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Exporter CSV
            </Btn>
          </a>
        }
      />

      <Card>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E8E8F0', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Rechercher commande ou client..." />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: '9px 14px', border: '1.5px solid #E8E8F0', borderRadius: 10, fontFamily: 'inherit', fontSize: 13, outline: 'none', cursor: 'pointer' }}>
            {ORDER_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <DataTable columns={cols} rows={data || []} loading={isLoading} emptyMessage="Aucune commande trouvée" />
      </Card>

      {/* Update Status Modal */}
      <Modal open={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={`Modifier commande #${selectedOrder?.order_number}`}
        footer={
          <>
            <Btn variant="outline" onClick={() => setSelectedOrder(null)}>Annuler</Btn>
            <Btn variant="primary" onClick={() => updateMutation.mutate({ id: selectedOrder.id, data: updateForm })} disabled={updateMutation.isLoading}>
              {updateMutation.isLoading ? 'Mise à jour...' : 'Sauvegarder'}
            </Btn>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Select label="Nouveau statut" value={updateForm.status} onChange={e => setUpdateForm(f => ({...f, status: e.target.value}))}
            options={UPDATE_STATUS_OPTIONS} />
          <Input label="N° de suivi" value={updateForm.tracking_number} onChange={e => setUpdateForm(f => ({...f, tracking_number: e.target.value}))} placeholder="Ex: TN12345678" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#5A5A72' }}>Commentaire interne</label>
            <textarea value={updateForm.comment} onChange={e => setUpdateForm(f => ({...f, comment: e.target.value}))}
              rows={3} placeholder="Note visible uniquement par l'équipe..."
              style={{ padding: '10px 14px', border: '1.5px solid #E8E8F0', borderRadius: 10, fontFamily: 'inherit', fontSize: 14, outline: 'none', resize: 'vertical' }} />
          </div>
          {selectedOrder && (
            <div style={{ padding: 14, background: '#F8F8FC', borderRadius: 10, fontSize: 13 }}>
              <p><strong>Client:</strong> {selectedOrder.user_name}</p>
              <p><strong>Total:</strong> {fmt(selectedOrder.total)} DT</p>
              <p><strong>Paiement:</strong> <StatusBadge status={selectedOrder.payment_status} /></p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}


// ==================== USERS PAGE ====================
export function AdminUsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const { confirm, Dialog: ConfirmDialog } = useConfirm();

  const params = { search };
  if (tab === 'active') params.is_active = 'true';
  if (tab === 'inactive') params.is_active = 'false';
  if (tab === 'staff') params.is_staff = 'true';

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, tab],
    queryFn: () => adminUsersAPI.list(params).then(r => r.data.results || r.data),
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => adminUsersAPI.toggleActive(id),
    onSuccess: (res) => { toast.success(res.data.message); qc.invalidateQueries(['admin-users']); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminUsersAPI.delete(id),
    onSuccess: () => { toast.success('Utilisateur supprimé'); qc.invalidateQueries(['admin-users']); },
  });

  const handleDelete = async (user) => {
    const ok = await confirm(`Supprimer le compte de ${user.full_name} ? Cette action est irréversible.`);
    if (ok) deleteMutation.mutate(user.id);
  };

  const cols = [
    { key: 'full_name', label: 'Nom', render: (v, row) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(230,57,70,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#E63946', flexShrink: 0 }}>
          {row.first_name?.[0]}{row.last_name?.[0]}
        </div>
        <div>
          <p style={{ fontWeight: 600, fontSize: 13 }}>{v}</p>
          {row.is_staff && <span style={{ fontSize: 10, background: 'rgba(10,10,15,0.08)', padding: '1px 6px', borderRadius: 100, fontWeight: 700 }}>Admin</span>}
        </div>
      </div>
    )},
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Téléphone', render: (v) => v || '—' },
    { key: 'order_count', label: 'Commandes' },
    { key: 'total_spent', label: 'Total dépensé', render: (v) => <strong>{parseFloat(v).toFixed(3)} DT</strong> },
    { key: 'is_email_verified', label: 'Vérifié', render: (v) => v ? <span style={{ color: '#15803D', fontSize: 12, fontWeight: 600 }}>✓ Oui</span> : <span style={{ color: '#9090A8', fontSize: 12 }}>Non</span> },
    { key: 'is_active', label: 'Statut', render: (v) => <StatusBadge status={v ? 'active' : 'inactive'} /> },
    { key: 'date_joined', label: 'Inscrit le', render: (v) => new Date(v).toLocaleDateString('fr-FR') },
    { key: '_actions', label: '', render: (_, row) => (
      <div style={{ display: 'flex', gap: 6 }}>
        <Btn size="sm" variant="outline" onClick={() => setSelectedUser(row)}>Voir</Btn>
        <Btn size="sm" variant={row.is_active ? 'danger' : 'success'} onClick={() => toggleMutation.mutate(row.id)}>
          {row.is_active ? 'Désactiver' : 'Activer'}
        </Btn>
        <Btn size="sm" variant="ghost" onClick={() => handleDelete(row)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#E63946" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
        </Btn>
      </div>
    )},
  ];

  return (
    <div>
      <ConfirmDialog />
      <PageHeader title="Clients" subtitle={`${data?.length || 0} utilisateurs`} />
      <Tabs
        tabs={[
          { id: 'all', label: 'Tous' },
          { id: 'active', label: 'Actifs' },
          { id: 'inactive', label: 'Inactifs' },
          { id: 'staff', label: 'Admins' },
        ]}
        active={tab} onChange={setTab}
      />
      <Card>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #E8E8F0' }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un client..." />
        </div>
        <DataTable columns={cols} rows={data || []} loading={isLoading} emptyMessage="Aucun client trouvé" />
      </Card>

      {/* User detail modal */}
      <Modal open={!!selectedUser} onClose={() => setSelectedUser(null)} title="Détails du client" width={480}>
        {selectedUser && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(230,57,70,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#E63946', flexShrink: 0 }}>
                {selectedUser.first_name?.[0]}{selectedUser.last_name?.[0]}
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 16 }}>{selectedUser.full_name}</p>
                <p style={{ color: '#9090A8', fontSize: 13 }}>{selectedUser.email}</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Téléphone', value: selectedUser.phone || '—' },
                { label: 'CIN', value: selectedUser.cin || '—' },
                { label: 'Commandes', value: selectedUser.order_count },
                { label: 'Total dépensé', value: `${parseFloat(selectedUser.total_spent || 0).toFixed(3)} DT` },
                { label: 'Email vérifié', value: selectedUser.is_email_verified ? 'Oui' : 'Non' },
                { label: 'Compte actif', value: selectedUser.is_active ? 'Oui' : 'Non' },
                { label: 'Inscrit le', value: new Date(selectedUser.date_joined).toLocaleDateString('fr-FR') },
                { label: 'Dernière connexion', value: selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleDateString('fr-FR') : 'Jamais' },
              ].map(item => (
                <div key={item.label} style={{ padding: 12, background: '#F8F8FC', borderRadius: 10 }}>
                  <p style={{ fontSize: 11, color: '#9090A8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{item.label}</p>
                  <p style={{ fontWeight: 600, fontSize: 14 }}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}


// ==================== PRODUCTS PAGE ====================
export function AdminProductsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [editProduct, setEditProduct] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({});
  const { confirm, Dialog: ConfirmDialog } = useConfirm();

  const params = { search };
  if (tab === 'inactive') params.is_active = 'false';
  if (tab === 'low_stock') params.low_stock = 'true';
  if (tab === 'featured') params.is_featured = 'true';

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', search, tab],
    queryFn: () => adminProductsAPI.list(params).then(r => r.data.results || r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (d) => d.id ? adminProductsAPI.update(d.id, d) : adminProductsAPI.create(d),
    onSuccess: () => { toast.success('Produit sauvegardé'); qc.invalidateQueries(['admin-products']); setEditProduct(null); setShowCreate(false); },
    onError: () => toast.error('Erreur lors de la sauvegarde'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminProductsAPI.delete(id),
    onSuccess: () => { toast.success('Produit supprimé'); qc.invalidateQueries(['admin-products']); },
  });

  const handleEdit = (p) => { setForm({ ...p }); setEditProduct(p); };
  const handleCreate = () => { setForm({ name: '', price: '', stock: 0, is_active: true, is_featured: false }); setShowCreate(true); };
  const handleDelete = async (p) => {
    const ok = await confirm(`Supprimer "${p.name}" ? Cette action est irréversible.`);
    if (ok) deleteMutation.mutate(p.id);
  };

  const cols = [
    { key: 'name', label: 'Produit', render: (v, row) => (
      <div>
        <p style={{ fontWeight: 600, fontSize: 13, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</p>
        <p style={{ fontSize: 11, color: '#9090A8', fontFamily: 'monospace' }}>{row.sku}</p>
      </div>
    )},
    { key: 'category_name', label: 'Catégorie', render: (v) => <span style={{ color: '#9090A8', fontSize: 12 }}>{v || '—'}</span> },
    { key: 'brand_name', label: 'Marque', render: (v) => <span style={{ color: '#9090A8', fontSize: 12 }}>{v || '—'}</span> },
    { key: 'price', label: 'Prix', render: (v) => <strong>{parseFloat(v).toFixed(3)} DT</strong> },
    { key: 'stock', label: 'Stock', render: (v) => (
      <span style={{ fontWeight: 700, color: v === 0 ? '#E63946' : v <= 5 ? '#D97706' : '#15803D' }}>{v}</span>
    )},
    { key: 'sales_count', label: 'Ventes' },
    { key: 'average_rating', label: 'Note', render: (v) => `${parseFloat(v).toFixed(1)} ★` },
    { key: 'is_active', label: 'Statut', render: (v) => <StatusBadge status={v ? 'active' : 'inactive'} /> },
    { key: '_actions', label: '', render: (_, row) => (
      <div style={{ display: 'flex', gap: 6 }}>
        <Btn size="sm" variant="outline" onClick={() => handleEdit(row)}>Modifier</Btn>
        <Btn size="sm" variant="ghost" onClick={() => handleDelete(row)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#E63946" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
        </Btn>
      </div>
    )},
  ];

  const ProductForm = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Input label="Nom du produit *" value={form.name || ''} onChange={e => setForm(f => ({...f, name: e.target.value}))} required />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Input label="Prix (DT) *" type="number" step="0.001" value={form.price || ''} onChange={e => setForm(f => ({...f, price: e.target.value}))} />
        <Input label="Prix barré (DT)" type="number" step="0.001" value={form.compare_price || ''} onChange={e => setForm(f => ({...f, compare_price: e.target.value}))} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Input label="SKU" value={form.sku || ''} onChange={e => setForm(f => ({...f, sku: e.target.value}))} />
        <Input label="Stock" type="number" value={form.stock ?? 0} onChange={e => setForm(f => ({...f, stock: parseInt(e.target.value)}))} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#5A5A72' }}>Description</label>
        <textarea value={form.description || ''} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={4}
          style={{ padding: '10px 14px', border: '1.5px solid #E8E8F0', borderRadius: 10, fontFamily: 'inherit', fontSize: 14, outline: 'none', resize: 'vertical' }} />
      </div>
      <div style={{ display: 'flex', gap: 20 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
          <input type="checkbox" checked={!!form.is_active} onChange={e => setForm(f => ({...f, is_active: e.target.checked}))} />
          Produit actif
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
          <input type="checkbox" checked={!!form.is_featured} onChange={e => setForm(f => ({...f, is_featured: e.target.checked}))} />
          En vedette
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
          <input type="checkbox" checked={!!form.is_new} onChange={e => setForm(f => ({...f, is_new: e.target.checked}))} />
          Nouveau
        </label>
      </div>
    </div>
  );

  return (
    <div>
      <ConfirmDialog />
      <PageHeader title="Produits" subtitle={`${data?.length || 0} produits`}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <a href={adminProductsAPI.exportCsv()} download>
              <Btn variant="outline" size="sm">Exporter CSV</Btn>
            </a>
            <Btn variant="primary" size="sm" onClick={handleCreate}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Ajouter un produit
            </Btn>
          </div>
        }
      />
      <Tabs tabs={[{id:'all',label:'Tous'},{id:'featured',label:'En vedette'},{id:'low_stock',label:'Stock bas'},{id:'inactive',label:'Inactifs'}]} active={tab} onChange={setTab} />
      <Card>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #E8E8F0' }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un produit..." />
        </div>
        <DataTable columns={cols} rows={data || []} loading={isLoading} emptyMessage="Aucun produit trouvé" />
      </Card>

      <Modal open={!!(editProduct || showCreate)} onClose={() => { setEditProduct(null); setShowCreate(false); }}
        title={editProduct ? `Modifier: ${editProduct.name}` : 'Nouveau produit'} width={560}
        footer={
          <>
            <Btn variant="outline" onClick={() => { setEditProduct(null); setShowCreate(false); }}>Annuler</Btn>
            <Btn variant="primary" onClick={() => saveMutation.mutate(editProduct ? { ...form, id: editProduct.id } : form)} disabled={saveMutation.isLoading}>
              {saveMutation.isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
            </Btn>
          </>
        }
      >
        <ProductForm />
      </Modal>
    </div>
  );
}
