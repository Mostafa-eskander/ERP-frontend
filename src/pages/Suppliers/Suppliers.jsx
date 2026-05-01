import { Activity, CircleUser, Delete, Edit, Eye, Plus, Trash } from 'lucide-react';
import SectionsHeader from '../../components/UI/SectionsHeader';
import SearchItem from '../../components/UI/SearchItem';
import TableItem from '../../components/UI/Table';
import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import Modal from '../../components/UI/Modal';
import classes from './Suppliers.module.css';

export default function SuppliersPage() {
    const [suppliers,setSuppliers] = useState([]);
    const [loading,setLoading] = useState(true);
    const [submitting,setSubmitting] = useState(false);
    const [modalOpen,setModalOpen] = useState(false);
    const [search,setSearch] = useState('');
    const [formData,setFormData] = useState({ id: null, name: '', contact_name: '', phone: '', email: '', address: '' });
    const [suppliersPayments,setSuppliersPayments] = useState([]);

    async function fetchData() {
        try{
            const {data} = await api.get('/suppliers');
            setSuppliers(data);
        }catch(error) {
            console.log(error);
        }finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    },[]);

    function handleOpenModal(item = null) {
        if(item) setFormData(item);
        else setFormData({ id: null, name: '', contact_name: '',phone: '', email: '', address: '' });
        setModalOpen(true);
    };

    async function handleSubmit(e) {
        e.preventDefault();
        setSubmitting(true);
        try {
            if(formData.id) {
                await api.put(`/suppliers/${formData.id}`, formData);
                setModalOpen(false);
                fetchData();
                toast.success('تم التعديل بنجاح',{position: 'bottom-right',autoClose:2000});
            }else {
                await api.post('/suppliers', formData)
                setModalOpen(false);
                fetchData();
                toast.success('تم الحفظ بنجاح',{position: 'bottom-right',autoClose:2000});
            }
        }catch(error) {
            toast.error('حدث خطأ');
        }finally {
            setSubmitting(false);
        }
    };

    async function handleDelete(id) {
        if (window.confirm('هل تريد حذف المورد')) {
            try {
                await api.delete(`/suppliers/${id}`);
                fetchData();
                toast.success('تم الحذف بنجاح',{position: 'bottom-right',autoClose: 2000});
            }catch(error) {
                toast.error('حدث خطأ');
            }
        }
    };

    async function handlePay(customer) {
        const {data} = await api.get(`/suppliers/${customer.id}`);

        const answer = window.prompt(`تسديد الدين - ${data.balance} - ${data.name}`);
        const answerFormatting = Number(answer);
        
        if(answerFormatting <= 0) {
            toast.info('يجب ان يكون الرقم اكبر من 0',{position: 'bottom-right',autoClose: 2000});
            return;
        }
        try {
            await api.post(`/suppliers/${customer.id}/pay`, {
                amount: answerFormatting,
                payment_method: 'cash'  
            });
            toast.success('تم تحصيل المبلغ بنجاح',{position: 'bottom-right',autoClose:200});
            fetchData();
        }catch(error) {
            toast.error(error,{position:'bottom-right',autoClose:2000});
        }

    }
    const filteredSuppliers = suppliers.filter((supplier) => 
        supplier.name.toLowerCase().includes(search.toLowerCase()) || 
        supplier.phone && supplier.phone.includes(search)
    );

    if(loading) {
        return  (
            <div className='loadingWrapper'>
                <Activity className='spin' size={48} color='var(--secondary-color)' />
            </div>
        )
    }
    
    return(
        <div className={classes.customers}>
            <SectionsHeader title='إدارة العملاء' description='إدارة بيانات عملائك ومديونياتهم'>
                <button className={'btn-primary ' + classes.btn} onClick={() => handleOpenModal()}><Plus /> اضافة عميل</button>
            </SectionsHeader>
            <SearchItem>
                <input value={search} onChange={(e) => setSearch(e.target.value)} className='inp-primary' type="text" id="customersSearch" placeholder='* اسم العميل' />
            </SearchItem>
            <TableItem>
                <thead>
                    <tr>
                        <th>الاسم</th>
                        <th>رقم الهاتف</th>
                        <th>التواصل</th>
                        <th>البريد الإلكتروني</th>
                        <th>المديونية (آجل)</th>
                        <th>الإجراءات</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredSuppliers.map((supplier) => {
                        const suppliersBalance = Number(supplier.balance);
                        return (
                        <tr key={supplier.id}>
                            <td>
                                <div className={classes.suppName}>
                                    <CircleUser />
                                    <span>{supplier.name}</span>
                                </div>
                            </td>
                            <td>{supplier.phone}</td>
                            <td>{supplier.contact_name}</td>
                            <td className={classes.tdOverFlow}>{supplier.email}</td>
                            <td className={suppliersBalance > 0 ? classes.balance : null}>{supplier.balance}</td>
                            <td>
                                <div className='actionsCell'>
                                    {suppliersBalance > 0 && <button className={`btn edit`} title='تحصيل' onClick={() => handlePay(supplier)}><Activity size={18} /></button>}
                                    <button className={`btn edit`} title='تعديل' onClick={() => handleOpenModal(supplier)}><Edit size={18} /></button>
                                    <button className={`btn delete`} title='حذف العميل' onClick={() => handleDelete(supplier.id)}><Trash size={18} /></button>
                                </div>
                            </td>
                        </tr>
                    )})}
                </tbody>
            </TableItem>
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title='إضافة عميل'>
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
                    <div className='inpRowComp'>
                        <label htmlFor='supplierAddress'>العنوان</label>
                        <textarea className='inp-primary' value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} name="supplierAddress" id="supplierAddress"></textarea>
                    </div>
                    <button className={`btn-primary ${classes.btnSubmit}`} type='submit' disabled={submitting}>
                        {submitting ? 'جاري الحفظ' : 'حفظ'}
                    </button>
                </form>
            </Modal>
        </div>
    )
}