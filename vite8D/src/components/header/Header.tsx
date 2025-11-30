import styles from "./Header.module.css";
import { Link, useLocation } from "react-router-dom";
import { Home, User, BarChart2, Moon, Sun } from "lucide-react";

interface HeaderProps {
  dark: boolean;
  setDark: (value: boolean) => void;
}

export const Header = ({ dark, setDark }: HeaderProps) => {
    const location = useLocation();

    const isActive = (path: string) => {
        return location.pathname === path;
    };

    const toggleTheme = () => {
        const newTheme = !dark;
        setDark(newTheme);
        
        if (newTheme) {
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    };

    return (
        <header className={styles.header}>
            <div className={styles.leftSection}>
                <a href="https://alfabank.ru/alfafuture/" className={styles.logoLink}>
                    <img src="/alfa-logo.svg" alt="Alfa Logo" className={styles.logo} />
                </a>
                <h1 className={styles.title}>8D</h1>
            </div>

            <nav className={styles.nav}>
                <Link 
                    className={`${styles.navItem} ${isActive("/") ? styles.active : ""}`} 
                    to="/"
                >
                    <Home size={18} /> Главная
                </Link>
                <Link 
                    className={`${styles.navItem} ${isActive("/metrics") ? styles.active : ""}`} 
                    to="/metrics"
                >
                    <BarChart2 size={18} /> Метрики
                </Link>
                <Link 
                    className={`${styles.navItem} ${isActive("/client") ? styles.active : ""}`} 
                    to="/client"
                >
                    <User size={18} /> Клиент
                </Link>
            </nav>

            <button className={styles.themeBtn} onClick={toggleTheme}>
                {dark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
        </header>
    );
}