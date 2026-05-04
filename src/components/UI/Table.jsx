import classes from './Table.module.css';

export default function TableItem({children,title,emptyMessage}) {
    return(
        <div className={classes.table}>
            <h3>{title}</h3>
            <table className={classes.tableData}>
                {children}
            </table>
            <h4 className={classes.emptyMessage}>{emptyMessage}</h4>
        </div>
    )
}