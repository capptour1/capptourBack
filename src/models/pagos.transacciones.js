export default (sequelize, DataTypes) => {
    const Transacciones = sequelize.define('Transacciones', {
        id_transaccion: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
    }, {
        tableName: 'transacciones',
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        schema: 'pagos',
    });

    return Transacciones;
};