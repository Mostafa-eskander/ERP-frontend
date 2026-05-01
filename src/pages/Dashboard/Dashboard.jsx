import { CloudDownload, DollarSign, Package, ShoppingBag, Users,Activity,TriangleAlert } from 'lucide-react';
import SectionsHeader from '../../components/UI/SectionsHeader';
import classes from './Dashboard.module.css';
import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import TableItem from '../../components/UI/Table';

export default function Dashboard() {
    const [stats,setStats] = useState({
        total_sales: 0,
        total_orders: 0,
        total_products: 0,
        total_customers: 0,
        recent_orders: []
    })
    const [allOrders,setAllOrders] = useState([]);
    const [lowStock, setLowStock] = useState([]);
    const [branches,setBranches] = useState([]);
    const [loading,setLoading] = useState(true);

    const [topClient, setTopClient] = useState({ name: '', amount: 0 });
    const [topSupplier, setTopSupplier] = useState({ name: '', amount: 0 });
    
    async function fetchData() {
        try {
            const [{data: dashData },{data: branchesData }] = await Promise.all([
                api.get('/dashboard'),
                api.get('/branches')
            ]);
            setStats({
                total_sales: parseFloat(dashData.total_sales || 0),
                total_orders: dashData.total_orders || 0,
                total_products: dashData.total_products || 0,
                total_customers: dashData.total_customers || 0,
                recent_orders: dashData.recent_orders || []
            });
            setBranches(branchesData || []);
            setLowStock(dashData.low_stock_products || []);

            if(dashData.top_customer) {
                setTopClient({ name: dashData.top_customer.name, amount: parseFloat(dashData.top_customer.amount || 0) });
            }
            if (dashData.top_supplier) {
                setTopSupplier({ name: dashData.top_supplier.name, amount: parseFloat(dashData.top_supplier.amount || 0) });
            }
        }catch(error) {
            console.log(error);
        }finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
    },[])
    
    const statCards = [
        { title: 'إجمالي المبيعات', value: `$${stats.total_sales.toLocaleString(undefined, {minimumFractionDigits: 2})}`, icon: DollarSign, color: 'var(--primary-color)' },
        { title: 'عدد الطلبات (مبيعات)', value: stats.total_orders, icon: ShoppingBag, color: 'var(--secondary-color)' },
        { title: 'العملاء', value: stats.total_customers, icon: Users, color: 'var(--warning-color)' },
        { title: 'المنتجات', value: stats.total_products, icon: Package, color: 'var(--danger-color)' },
        { title: `أفضل عميل: ${topClient.name || 'لايوجد بيانات'}`, value: `$${topClient.amount.toFixed(2)}`, icon: Activity, color: '#10B981' },
        { title: `أكبر مورد: ${topSupplier.name || 'لايوجد بيانات'}`, value: `$${topSupplier.amount.toFixed(2)}`, icon: Package, color: '#8B5CF6' },
    ];
    
    const handleExport = async () => {
        try {
            const { data: exportOrders } = await api.get('/orders');
            
            if (!exportOrders || exportOrders.length === 0) {
                alert("لا توجد مبيعات لتصديرها.");
                return;
            }
            
            const rows = [
            ["تاريخ الطباعة", "رقم الطلب", "اسم العميل", "المبلغ", "الحالة"]
            ];
            
            exportOrders.forEach(row => {
                const d = new Date(row.created_at).toLocaleDateString("ar-EG");
                const statusStr = row.status === 'completed' ? 'مكتمل' : 'دين / آجل';
                rows.push([d, `#${row.id}`, row.customer?.name || 'مبيعة عامة بدون اسم', row.grand_total, statusStr]);
            });
            
            rows.push([]);
            rows.push(["الملخص والمبيعات النقدي"]);
            rows.push(["إجمالي مبيعات المتجر", stats.total_sales]);
            rows.push(["إجمالي الطلبات", stats.total_orders]);
            rows.push([t('summary_and_cash_sales')]);
            rows.push([t('total_store_sales'), stats.total_sales]);
            rows.push([t('total_orders'), stats.total_orders]);
            
            const csvContent = "\uFEFF" + rows.map(e => e.join(",")).join("\n");
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.setAttribute("download", `${t('store_report')}_${new Date().getTime()}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e) {
            toast.error('خطأ',{position: 'bottom-right',autoClose: 2000})
        }
    };

    if (loading) {
        return <div className='loadingWrapper'><Activity className="spin" size={48} color="var(--primary-color)" /></div>;
    }

    
    return (
        <div className={classes.dashboard}>
            <SectionsHeader title='لوحة القيادة' description='مرحباً بك! نظرة عامة على نشاط النظام'>
                <button className='btn-primary' onClick={() => handleExport()}>تصدير <CloudDownload size={18} /></button>
            </SectionsHeader>
            <div className={classes.statsGrid}>
                {statCards.map(s => (
                    <div className={classes.statGrid} style={{borderLeftColor : s.color}}>
                        <div style={{ backgroundColor: `${s.color}20`, color: s.color }}>
                            <s.icon size={20} />
                        </div>
                        <div>
                            <p>{s.title}</p>
                            <h3>{s.value}</h3>
                        </div>
                    </div>
                ))}
            </div>
            <TableItem title='المبيعات'>
                <thead>
                    <tr>
                        <th>المعرف</th>
                        <th>العملاء</th>
                        <th>التاريخ</th>
                        <th>المبلغ</th>
                        <th>الحالة</th>
                    </tr>
                </thead>
                <tbody>
                    {stats.recent_orders.map((o) => {
                            return (
                                <tr key={o.id}>
                                    <td>{o.id}</td>
                                    <td>{o.customer?.name || 'غير محدد'}</td>
                                    <td>{new Date(o.created_at).toLocaleString()}</td>
                                    <td style={{color: 'var(--primary-color)'}}>{o.total}</td>
                                    <td>
                                        <span className={o.status === 'completed' ? classes.completed : classes.pending}>
                                            {o.status}
                                        </span>
                                    </td>
                                </tr>
                            )
                    })}
                </tbody>
            </TableItem>
            <div className={classes.stockAlert}>
                <h2><TriangleAlert size={20} /> تنبيهات نقص المخزون</h2>
                {lowStock.map((s) => {
                    return (
                        <div key={s.id} className={classes.alertMessage}>
                            <div>
                                <h3>{s.name}</h3>
                                <p>{s.sku || 'Not Fount'}: SKU</p>
                            </div>
                            <div>
                                <span>المخزون : {s.stock}</span>
                            </div>
                        </div>
                    ) 
                })}
            </div>
            <TableItem title={`إحصائيات وقيّم المخزون`}>
                <thead>
                    <tr>
                        <th>الفرع</th>
                        <th>عناصر فريدة</th>
                        <th>إجمالي الكمية</th>
                    </tr>
                </thead>
                <tbody>
                    {branches.length > 0 ? branches.map((b) => {
                        let totalItems = b.inventories ? b.inventories.length : 0;
                        let totalQty = b.inventories ? b.inventories.reduce((acc, item) => acc + parseInt(item.stock || 0), 0) : 0;
                        return (
                            <tr key={b.id}>
                               <td><strong>{b.name}</strong> {b.location ? `(${b.location})` : ''}</td>
                               <td>{totalItems}</td>
                               <td style={{color: 'var(--primary-color)', fontWeight: 'bold'}}>{totalQty}</td>
                            </tr>
                          )
                        }) : (
                            <tr><td colSpan="3" className={classes.emptyState}>لا يوجد فروع</td></tr>
                        )}
                </tbody>
            </TableItem>
        </div>
    )
}