import classes from './Table.module.css';

export default function TableItem({children,title}) {
    return(
        <div className={classes.table}>
            <h3>{title}</h3>
            <table className={classes.tableData}>
                {children}
            </table>
        </div>
    )
}