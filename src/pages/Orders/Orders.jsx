import { useEffect, useState } from 'react';
import SectionsHeader from '../../components/UI/SectionsHeader';
import classes from './Orders.module.css';
import api from '../../api/axios';
import SearchItem from '../../components/UI/SearchItem';
import TableItem from '../../components/UI/Table';
import { Activity, CheckCircle, Eye } from 'lucide-react';
import Modal from '../../components/UI/Modal';

export default function OrdersPage() {
    const [orders,setOrders] = useState([]);
    const [loading,setLoading] = useState(true);
    const [search,setSearch] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);



    async function fetchData() {
        try{
            const {data} = await api.get('/orders');
            setOrders(data);
            if (selectedOrder) {
                const updated = data.find(o => o.id === selectedOrder.id);
                if (updated) setSelectedOrder(updated);
                else setSelectedOrder(null);
            }
        }catch(error) {
            console.log(error);
        }finally {
            setLoading(false);
        }
    }

    
    useEffect(() => {
        fetchData();
    },[]);

    const filteredOrders = orders.filter(order => 
        order.id.toString().includes(search) || 
        (order.customer?.name && order.customer.name.toLowerCase().includes(search.toLowerCase()))
    )

    if(loading) {
        return  (
            <div className='loadingWrapper'>
                <Activity className='spin' size={48} color='var(--primary-color)' />
            </div>
        )
    }
    return(
        <div className={classes.orders}>
            <SectionsHeader title='سجل المبيعات' description='تتبع كافة الطلبات ومراجعة المبالغ المحصلة' />
            <SearchItem>
                <input type="text" className='inp-primary' name="inpSearch" id="inpSearch" value={search} onChange={(e) => setSearch(e.target.value)} placeholder='بحث باسم العميل او الرقم التعريفي' />
            </SearchItem>

            <TableItem emptyMessage={filteredOrders.length === 0 ? 'لا توجد مبيعات اذهب الي POS لإضافه فاتوره' : ''}>
                <thead>
                    <tr>
                        <th>المعرف</th>
                        <th>العملاء</th>
                        <th>Payment</th>
                        <th>التاريخ</th>
                        <th>المبلغ</th>
                        <th>الحالة</th>
                        <th>Details</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredOrders.map((order) => {
                        return (
                            <tr key={order.id}>
                                <td>{order.id}</td>
                                <td>{order.customer?.name || "غير موجود"}</td>
                                <td>{order.payment_method}</td>
                                <td className={classes.date}>{new Date(order.created_at).toLocaleString()}</td>
                                <td className={classes.total}>{order.total}</td>
                                <td>
                                    <span className={classes.status}>
                                        <CheckCircle size={14} />
                                        {order.status}
                                    </span>
                                </td>
                                <td>
                                    <div className={classes.details}>
                                        <button className={`btn edit`} title='التفاصيل' onClick={() => setSelectedOrder(order)}><Eye size={20} /></button>
                                    </div>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </TableItem>
            <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={`سجل المبيعات #${selectedOrder?.id}`}>
                {selectedOrder && (
                    <div>
                        <div>
                            <div className={classes.title}><strong>العميل :</strong> {selectedOrder.customer ? selectedOrder.customer.name : 'Walk-in'}</div>
                            <div className={classes.title}><strong>التاريخ :</strong> {new Date(selectedOrder.created_at).toLocaleString()}</div>
                            <TableItem>
                                <thead>
                                    <tr>
                                        <th>المنتجات</th>
                                        <th>الكميه</th>
                                        <th>السعر</th>
                                        <th>المبلغ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedOrder.items?.map(item => (
                                        <tr key={item.id}>
                                            <td>{item.product?.name || "غير معروف"}</td>
                                            <td>{item.quantity}</td>
                                            <td>${parseFloat(item.subtotal).toFixed(2)}</td>
                                            <td>${item.quantity * parseFloat(item.subtotal).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </TableItem>
                        </div>
                        <h2 className={classes.title}>الاجمالي : {parseFloat(selectedOrder.total).toFixed(2)}</h2>
                        <div className={classes.title}>الضرائب : ({parseFloat(selectedOrder.total) > 0 ? Math.round((parseFloat(selectedOrder.tax) / parseFloat(selectedOrder.total)) * 100) : 0}%): <span>${parseFloat(selectedOrder.tax).toFixed(2)}</span></div>
                    </div>
                )}
            </Modal>
        </div>
    )
}