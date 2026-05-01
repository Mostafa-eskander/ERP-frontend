import { PanelLeft, LogOut,User,Moon,Sun,Bell,Globe  } from 'lucide-react';

import classes from './Navbar.module.css';
import { useEffect, useState } from 'react';
import useAuthStore from '../../store/appContext';
import { useNavigate } from 'react-router-dom';

export default function Navbar({onSideBarOpen}) {
    const { user,logout } = useAuthStore();
    const navigate = useNavigate();
    
    const [mode,setMode] = useState(() => {
        return localStorage.getItem('theme') === 'dark'
    });

    useEffect(() => {
        if(mode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme','dark');
        }else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme','light');
        }
    },[mode]);

    function toggleMode() {
        setMode((prevMode) => !prevMode)
    }

    async function handleLogout () {
        try {
            await logout();
            navigate('/login', { replace: true });
        } catch (err) {
            console.log(err);
        }
    };
    return(
        <header className={classes.header}>
            <div className={classes.rigthHeader}>
                <button className='btn' onClick={onSideBarOpen}><PanelLeft /></button>
            </div>
            <div className={classes.leftHeader}>
                <div className={classes.leftSection}>
                    <button className='btn' onClick={toggleMode}>
                        {mode ? <Sun size={20}/> : <Moon size={20} />}
                    </button>
                    {/* <div className={classes.notifContainer}>
                        <button className='btn'>
                            <Bell size={20} />
                        </button>
                    </div> */}
                </div>
                <div className={classes.userInfo}>
                    <div className={classes.avatar}>
                        <User />
                    </div>
                    <div className={classes.details}>
                        <span className={classes.user}>{user?.name}</span>
                        <span className={classes.role}>{user?.role}</span>
                    </div>
                </div>
                <div className={classes.logout}>
                    <button className='btn' onClick={handleLogout}>
                        <LogOut size={20} />
                    </button>
                </div>
            </div>
        </header>
    )
}