export default (sequelize, DataTypes) => {
    const ReservaCamara = sequelize.define('ReservaCamara', {
        id_permiso: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        id_reserva: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
        },
        estado: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'A',
        },
        fecha_creacion: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    }, {
        tableName: 'reserva_camara',
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        schema: 'reserva',
    });

    ReservaCamara.associate = (models) => {
        models.ReservaCamara.belongsTo(models.Reserva, {
            foreignKey: 'id_reserva',
            targetKey: 'id_reserva',
            as: 'reserva',
        });
    };

    return ReservaCamara;
};