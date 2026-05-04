import { useEffect, useState } from 'react';
import TableItem from '../../components/UI/Table';
import classes from './Customer.module.css';
import { useParams } from 'react-router-dom';
import api from '../../api/axios';
import Modal from '../../components/UI/Modal';
import { Activity } from 'lucide-react';
import { toast } from 'react-toastify';

export default function CustomerPage() {
    const { customerId } = useParams();
    const [customerData,setCustomerData] = useState({});
    const [customerOrders,setCustomerOrders] = useState([])
    const [loading,setLoading] = useState(true);
    const [modalOpen,setModalOpen] = useState(false);
    const [formData,setFormData] = useState({ id: null, name: '', phone: '', email: '', address: '' });
    const [submitting,setSubmitting] = useState(false);


    async function fetchData() {
        if(!customerId) return;

        try {
            const [ordersRes, customerRes] = await Promise.all([
                api.get('/orders'),
                api.get(`/customers/${customerId}`)
            ]);

            const filteredOrders = ordersRes.data.filter(
                (o) => Number(o.customer_id) === Number(customerId)
            );

            setCustomerOrders(filteredOrders);
            setCustomerData(customerRes.data);
        }catch(error) {
            console.log(error);
        }finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
    },[customerId]);

    function handleOpenModal(item = null) {
        if(item) setFormData(item);
        else setFormData({ id: null, name: '', phone: '', email: '', address: '' });
        setModalOpen(true);
    };

    async function handleSubmit(e) {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.put(`/customers/${formData.id}`, formData);
            setModalOpen(false);
            fetchData();
            toast.success('تم التعديل بنجاح',{position: 'bottom-right',autoClose:2000});
        }catch(error) {
            console.log(error);
        }finally {
            setSubmitting(false)
        }
    }

    const payments = customerData.payments || [];

    if(loading) return (<div className='loadingWrapper'><Activity className='spin' style={{color: 'var(--primary-color)'}} size={48} /></div>)
    
    return(
        <div className={classes.customer}>

            <div className={classes.userInfo}>
                <h2>اسم العميل : <span>{customerData.name || 'لا توجد معلومات'}</span></h2>
                <h3>رقم العميل : <span>{customerData.phone || 'لا توجد معلومات'}</span></h3>
                <h5>عنوان العميل : <span>{customerData.address || 'لا توجد معلومات'}</span></h5>
                <p>ايميل العميل : <span>{customerData.email || 'لا توجد معلومات'}</span></p>
                <h4>مديونيات : <span className={`${customerData.balance > 0 ? classes.balance : classes.notBalance}`}>{customerData.balance}</span></h4>
                <button className={classes.btnEdit} onClick={() => handleOpenModal(customerData)}>تعديل البيانات</button>
            </div>
        
            <div className={classes.customerRecord}>
                <h2 className={classes.sectionHeader}>سجل العميل</h2>
                <TableItem emptyMessage={customerOrders.length === 0 ? 'لا يوجد سجل للعميل ' : ''}>
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
                        {customerOrders.map((o) =>{
                            const productNames = o.items
                            .map(i => i.product?.name)
                            .filter(Boolean)
                            .join(', ');

                            return (
                                <tr key={o.id}>
                                    <td>{o.id}</td>
                                    <td className={classes.orderDate}>{new Date(o.created_at).toLocaleString()}</td>
                                    <td className={`${o.payment_method === 'cash' ? classes.cash : classes.card}`}>{o.payment_method}</td>
                                    <td className={classes.productName}>{productNames}</td>
                                    <td>{o.grand_total}</td>
                                    <td>{o.paid_amount}</td>
                                    <td className={`${Number(o.due_amount) > 0 ? classes.dueAmount : ''}`}>${o.due_amount}</td>
                                </tr>
                            )
                        })}
                        {customerOrders.length === 0 && (
                            <tr className={classes.emptyOrders}>
                                <td>لا توجد طلبات</td>
                            </tr>
                        )}
                    </tbody>
                </TableItem>
            </div>

            <div className={classes.customerTransactions}>
                <h2 className={classes.sectionHeader}>سجل التعاملات الماليه</h2>
                <TableItem emptyMessage={payments.length === 0 ? 'لا يوجد سجل للعميل' : ''}>
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

                        {(!customerData.payments || customerData.payments.length === 0) && (
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
                            <label htmlFor="customerName">الاسم *</label>
                            <input type='text' className='inp-primary' value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} name="customerName" id="customerName" required />
                        </div>
                        <div className="inpRow">
                            <label htmlFor="customerPhone">رقم الهاتف *</label>
                            <input type='text' className='inp-primary' value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} name="customerPhone" id="customerPhone" required />
                        </div>
                    </div>
                    <div className='inpRowComp'>
                        <label htmlFor='customerEmail'>البريد الإلكتروني</label>
                        <input type='email' className='inp-primary' value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}  name="customerEmail" id="customerEmail" />
                    </div>
                    <div className='inpRowComp'>
                        <label htmlFor='customerAddress'>العنوان</label>
                        <textarea className='inp-primary' value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} name="customerAddress" id="customerAddress"></textarea>
                    </div>
                    <button className={`btn-primary ${classes.btnSubmit}`} type='submit' disabled={submitting}>
                        {submitting ? 'جاري الحفظ' : 'حفظ'}
                    </button>
                </form>
            </Modal>
        
        </div>
    )
}