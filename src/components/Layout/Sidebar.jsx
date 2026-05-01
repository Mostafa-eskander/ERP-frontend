import {LayoutDashboard,ShoppingCart,Package,Layers,Users,Truck,ClipboardList,ShoppingBag,Settings,PanelRight} from 'lucide-react'

import classes from './Sidebar.module.css';
import { NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import useAuthStore from '../../store/appContext';

const RoleAccess = {
  admin: ['/dashboard', '/pos', '/orders', '/products', '/categories', '/purchases', '/customers', '/suppliers', '/branches', '/users', '/settings'],
  general_accountant: ['/dashboard', '/orders', '/purchases', '/customers', '/suppliers'],
  branch_accountant: ['/dashboard', '/orders', '/purchases', '/customers', '/suppliers'],
  branch_manager: ['/dashboard', '/pos', '/orders', '/products', '/categories', '/purchases', '/customers', '/suppliers'],
  cashier: ['/pos', '/orders']
};


export default function Sidebar({sideBarMode,onSideBarOpen}) {
    const savedConfig = JSON.parse(localStorage.getItem('storeConfig'));
    const [storeName, setStoreName] = useState(savedConfig?.storeName || "");
    
    const {user} = useAuthStore();
    
    const userRole = user?.role || 'cashier';
    const allowedRoutes = RoleAccess[userRole]|| RoleAccess.cashier;
    
    const AllRoutes = [
        {path: '/dashboard',icon: LayoutDashboard,label: "لوحة القيادة"},
        {path: '/pos',icon: ShoppingCart,label: "نقطة البيع"},
        {path: '/products',icon: Package,label: "المنتجات"},
        {path: '/categories',icon: Layers,label: "الأقسام"},
        {path: '/customers',icon: Users,label: "العملاء"},
        {path: '/suppliers',icon: Truck,label: "الموردين"},
        {path: '/orders',icon: ClipboardList,label: "المبيعات"},
        {path: '/purchases',icon: ShoppingBag,label: "المشتريات"},
        {path: '/branches',icon: Package,label: "الفروع"},
        {path: '/employees',icon: LayoutDashboard,label: "الموظفين"},
        {path: '/settings',icon: Settings,label: "الإعدادات"},
    ]
    
    
    const filteredItems = AllRoutes.filter(item => allowedRoutes.includes(item.path));

    return(
        <aside className={sideBarMode ? classes.sidebar : `${classes.sidebar} ${classes.sideActive}`}>
            <div className={classes.logo}>
                <h2>ERP - {storeName}</h2>
                <button className='btn' onClick={onSideBarOpen}><PanelRight /></button>
            </div>
            <nav className={classes.nav}>
                {filteredItems.map((route) => (
                    <NavLink
                        key={route.path}
                        to={route.path}
                        className={({ isActive }) => 
                            isActive ? `${classes.navItem} ${classes.active}` : classes.navItem
                        }
                        onClick={() => {
                            if (window.innerWidth <= 768) onSideBarOpen();
                        }}
                    >
                        <route.icon size={20}/>
                        <span>{route.label}</span>
                    </NavLink>
                ))}
            </nav>
        </aside>
    )
}