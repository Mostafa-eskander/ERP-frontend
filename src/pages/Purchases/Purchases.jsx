import { Plus, ShoppingBag,Activity } from 'lucide-react';
import SectionsHeader from '../../components/UI/SectionsHeader';
import classes from './Purchases.module.css';
import TableItem from '../../components/UI/Table';
import { useEffect, useState } from 'react';
import api from '../../api/axios';
import SearchItem from '../../components/UI/SearchItem';
import Modal from '../../components/UI/Modal';
import { toast } from 'react-toastify';

export default function PruchasesPage() {
    const [purchases,setPurchases] = useState([]);
    const [products,setProducts] = useState([]);
    const [suppliers,setSuppliers] = useState([]);
    const [loading,setLoading] = useState(true);
    const [modalOpen,setModalOpen] = useState(false);
    const [submitting,setSubmitting] = useState(false);
    const [search,setSeartch] = useState('');

    const [formData,setFormData] = useState({
        supplier_id: '', product_id: '', quantity: 1, unit_cost: '', paid_amount: '', status: 'completed'
    });

    async function fetchData() {
        try {
            const [purchRes,supRes,prodRes] = await Promise.all([
                api.get('/purchases'),
                api.get('suppliers'),
                api.get('/products')
            ]);

            setPurchases(purchRes.data);
            setSuppliers(supRes.data);
            setProducts(prodRes.data);
        }catch(error) {
            console.log(error);
        }finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
    },[]);

    function handleOpenModal() {
        setFormData({ supplier_id: suppliers[0]?.id || '', product_id: '', quantity: 1, unit_cost: '', paid_amount: '', status: 'completed' });
        setModalOpen(true);
    }

    function handleProductChange(pid) {
        const prod = products.find(p => p.id == pid);
        if(prod) {
            setFormData({...formData,product_id: pid,unit_cost: prod.cost});
        }else {
            setFormData({...formData, product_id: pid});
        }
    }
    async function handleSubmit(e) {
        e.preventDefault();
        const total = formData.quantity * parseFloat(formData.unit_cost || 0);
        const paid = formData.paid_amount === '' ? total: parseFloat(formData.paid_amount);
        
        if(paid < total && !formData.supplier_id) {
            toast.warning('تحقق خطا',{position:'bottom-right',autoClose: 2000});
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                supplier_id: formData.supplier_id || null,
                total_amount: total,
                paid_amount: paid,
                status: paid < total ? 'pending' : 'completed',
                items: [
                    {
                        product_id: formData.product_id,
                        quantity: formData.quantity,
                        unit_cost: parseFloat(formData.unit_cost || 0),
                        total: total
                    }
                ]
            }
            await api.post('/purchases', payload);
            setModalOpen(false);
            toast.success('تم حفظ البيانات',{position: 'bottom-right',autoClose: 2000});
            fetchData();
        }catch(error) {
            toast.error(error,{position: 'bottom-right',autoClose: 2000});
        }finally {
            setSubmitting(false);
        }
    }

    const filterPruchases = purchases.filter((p) => 
        p.supplier.name.toLowerCase().includes(search.toLowerCase()) ||
        p.created_at.includes(search)
    );

    if (loading) return <div className="loadingWrapper"><Activity className="spin" size={48} color="var(--primary-color)" /></div>;
    return(
        <div className={classes.pruchases}>
            <SectionsHeader title='إدارة المشتريات والمخزون' description='سجل فواتير المشتريات لتحديث كمية وتكلفة المخزون تلقائياً'>
                <button className='btn-primary' onClick={() => handleOpenModal()}>
                    <Plus size={18} />فاتورة مشتريات جديدة
                </button>
            </SectionsHeader>
            <SearchItem>
                <input type="text" className='inp-primary' value={search} onChange={(e) => setSeartch(e.target.value)} name="inoSearch" id="inoSearch" placeholder='بحث باسم العميل او التاريخ' />
            </SearchItem>
            <TableItem>
                <thead>
                    <tr>
                        <th>المعرف</th>
                        <th>المورد</th>
                        <th>التاريخ</th>
                        <th>المبلغ</th>
                        <th>الحالة</th>
                    </tr>
                </thead>
                <tbody>
                    {filterPruchases.map((p) => {
                        return (
                            <tr key={p.id}>
                                <td>#{p.id}</td>
                                <td>
                                    <div className={classes.name}>
                                        <ShoppingBag size={18} />
                                        <strong>{p.supplier?.name || '-'}</strong>
                                    </div>
                                </td>
                                <td>{new Date(p.created_at).toLocaleString()}</td>
                                <td className={classes.price}>${parseFloat(p.total_amount).toFixed(2)}</td>
                                <td>
                                    <span className={classes.status}>تم الاستلام بالمخزن</span>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </TableItem>
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title='فاتورة مشتريات جديدة'>
                <form onSubmit={handleSubmit}>
                    <div className='inpRowComp'>
                        <label htmlFor="suppName">المورد *</label>
                        <select required className='inp-primary' value={formData.supplier_id} onChange={(e) => setFormData({...formData, supplier_id: e.target.value})} name="suppName" id="suppName">
                            {suppliers.map((s) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className='formGroupInp'>
                        <div>
                            <label htmlFor="ProductName">المنتج المستهدف *</label>
                            <select required className='inp-primary' value={formData.product_id} onChange={(e) => handleProductChange(e.target.value)}  name="ProductName" id="ProductName">
                                <option value="">-- اختر المنتح --</option>
                                {products.map((p) => (
                                    <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="quantity">الكمية المستلمة *</label>
                            <input required className='inp-primary' type="number" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: e.target.value})} name="quantity" id="quantity" />
                        </div>
                    </div>
                    <div className='inpRowComp'>
                        <label htmlFor="cost">سعر الوحدة (التكلفة) *</label>
                        <input required className='inp-primary' value={formData.unit_cost} onChange={(e) => setFormData({...formData,unit_cost: e.target.value})} type="text" name="cost" id="cost" />
                    </div>
                    <div className={`formGroup ${classes.balance}`}>
                        <span>إجمالي الفاتورة : {formData.quantity * parseFloat(formData.unit_cost || 0)}</span>
                        <label htmlFor="balance">المبلغ المدفوع (اتركه فارغاً للدفع بالكامل)</label>
                        <input className='inp-primary' value={formData.paid_amount} onChange={(e) => setFormData({...formData,paid_amount: e.target.value})}  type="number" step="0.01" min="0" max={formData.quantity * parseFloat(formData.unit_cost || 0)} name="balance" id="balance" />
                    </div>
                    <button className={`btn-primary ${classes.btn}`} disabled={submitting}>
                            {submitting ? 'جاري الحفظ' : 'حفظ'}
                    </button>
                </form>
            </Modal>
        </div>
    )
}