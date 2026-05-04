import { useEffect, useState } from 'react';
import TableItem from '../../components/UI/Table';
import classes from './Supplier.module.css';
import { useParams } from 'react-router-dom';
import api from '../../api/axios';
import Modal from '../../components/UI/Modal';
import { Activity } from 'lucide-react';
import { toast } from 'react-toastify';

export default function SupplierPage() {
    const { supplierId } = useParams();
    const [supplierData,setSupplierData] = useState({});
    const [supplierOrders,setSupplierOrders] = useState([])
    const [loading,setLoading] = useState(true);
    const [modalOpen,setModalOpen] = useState(false);
    const [formData,setFormData] = useState({ id: null, name: '', contact_name: '', phone: '', email: ''});
    const [submitting,setSubmitting] = useState(false);

    async function fetchData() {
        if(!supplierId) return;

        try {
            const [ordersRes, supplierRes] = await Promise.all([
                api.get('/purchases'),
                api.get(`/suppliers/${supplierId}`)
            ]);

            const filteredOrders = ordersRes.data.filter(
                (p) => Number(p.supplier_id) === Number(supplierId)
            );

            setSupplierOrders(filteredOrders);
            setSupplierData(supplierRes.data);
        }catch(error) {
            console.log(error);
        }finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
    },[supplierId]);
    
    function handleOpenModal(item = null) {
        if(item) setFormData(item);
        else setFormData({ id: null, name: '', contact_name: '',phone: '', email: ''});
        setModalOpen(true);
    };
    
    async function handleSubmit(e) {
        e.preventDefault();
        setSubmitting(true);
        try {
                await api.put(`/suppliers/${formData.id}`, formData);
                setModalOpen(false);
                fetchData();
                toast.success('تم التعديل بنجاح',{position: 'bottom-right',autoClose:2000});
        }catch(error){
            console.log(error);
        }finally {
            setSubmitting(false)
        }
    }

    const payments = supplierData.payments || [];

    if(loading) return (<div className='loadingWrapper'><Activity className='spin' style={{color: 'var(--primary-color)'}} size={48} /></div>)

    console.log(supplierData)
    return (
        <div className={classes.customer}>
        
            <div className={classes.userInfo}>
                <h2>اسم مورد : <span>{supplierData.name || 'لا توجد معلومات'}</span></h2>
                <h3>رقم مورد : <span>{supplierData.phone || 'لا توجد معلومات'}</span></h3>
                <h5>عنوان مورد : <span>{supplierData.contact_name || 'لا توجد معلومات'}</span></h5>
                <p>تواصل مورد : <span>{supplierData.email || 'لا توجد معلومات'}</span></p>
                <h4>مديونيات (علينا) : <span className={`${supplierData.balance > 0 ? classes.balance : classes.notBalance}`}>{supplierData.balance}</span></h4>
                <button className={classes.btnEdit} onClick={() => handleOpenModal(supplierData)}>تعديل البيانات</button>
            </div>
                
                <div className={classes.customerRecord}>
                    <h2 className={classes.sectionHeader}>سجل المورد</h2>
                    <TableItem emptyMessage={supplierOrders.length === 0 ? 'لا يوجد سجل للعميل' : ''}>
                        <thead>
                            <tr>
                                <th>معرفه العمليه</th>
                                <th>التاريخ</th>
                                <th>طريقه الدفع</th>
                                <th>المنتجات</th>
                                <th>الاجمالي</th>
                                <th>مدفوع</th>
                                <th>مديونيه</th>
                            </tr>
                        </thead>
                        <tbody>
                            {supplierOrders.map((o) =>{
                                const productNames = o.items
                                .map(i => i.product?.name)
                                .filter(Boolean)
                                .join(', ');
        
                                return (
                                    <tr key={o.id}>
                                        <td>{o.id}</td>
                                        <td className={classes.orderDate}>{new Date(o.created_at).toLocaleString()}</td>
                                        <td className={`${o.status !== 'pending' ? classes.cash : classes.card}`}>{o.status}</td>
                                        <td>{productNames}</td>
                                        <td>{o.total_amount}</td>
                                        <td>{o.paid_amount}</td>
                                        <td className={`${Number(o.due_amount) > 0 ? classes.dueAmount : ''}`}>${o.due_amount}</td>
                                    </tr>
                                    )
                                })}
                                {supplierOrders.length === 0 && (
                                    <tr className={classes.emptyOrders}>
                                        <td>لا توجد طلبات</td>
                                    </tr>
                                )}
                            </tbody>
                        </TableItem>
                </div>
        
                <div className={classes.customerTransactions}>
                    <h2 className={classes.sectionHeader}>سجل التعاملات الماليه</h2>
                    <TableItem emptyMessage={payments.length === 0 ? 'لا يوجد سجل تعاملات تابع للعميل' : ''}>
                        <thead>
                            <tr>
                                <th>المعرف</th>
                                <th>التاريخ</th>
                                <th>المبلغ</th>
                                <th>الملاحظه</th>
                            </tr>
                        </thead>
                        <tbody>
    
                            {payments.map((p) => (
                                <tr key={p.id}>
                                    <td>{p.id}</td>
                                    <td className={classes.tranDate}>{new Date(p.created_at).toLocaleString()}</td>
                                    <td>{p.amount}</td>
                                    <td>{p.payment_method}</td>
                                </tr>
                            ))}
    
                            {(!supplierData.payments || supplierData.payments.length === 0) && (
                                <tr className={classes.emptyOrders}>
                                    <td>لا توجد معاملات</td>
                                </tr>
                            )}
                        </tbody>
                    </TableItem>
                </div>
    
                <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="تعديل بيانات العميل">
                    <form onSubmit={handleSubmit}>
                        <div className='formGroupInp'>
                            <div className="inpRow">
                                <label htmlFor="supplierName">الاسم *</label>
                                <input type='text' className='inp-primary' value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} name="supplierName" id="supplierName" required />
                            </div>
                            <div className='inpRow'>
                                <label htmlFor="supplierContent">التواصل</label>
                                <input type="text" className='inp-primary' value={formData.contact_name} onChange={((e) => setFormData({...formData,contact_name: e.target.value}))} name="supplierContent" id="supplierContent" required />
                            </div>
                        </div>
                        <div className='formGroupInp'>
                            <div className="inpRow">
                                <label htmlFor="supplierPhone">رقم الهاتف *</label>
                                <input type='text' className='inp-primary' value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} name="supplierPhone" id="supplierPhone" required />
                            </div>
                            <div className='inpRow'>
                                <label htmlFor='supplierEmail'>البريد الإلكتروني</label>
                                <input type='email' className='inp-primary' value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}  name="supplierEmail" id="supplierEmail" />
                            </div>
                        </div>
                        <button className={`btn-primary ${classes.btnSubmit}`} type='submit' disabled={submitting}>
                            {submitting ? 'جاري الحفظ' : 'حفظ'}
                        </button>
                    </form>
                </Modal>
            
                </div>
    )
}