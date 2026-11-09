export default (sequelize, DataTypes) => {
    const UbicacionesActivas = sequelize.define('UbicacionesActivas', {
        usuario_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        latitude: {
            type: DataTypes.DOUBLE,
            allowNull: false,
        },
        longitude: {
            type: DataTypes.DOUBLE,
            allowNull: false,
        },
        actualizada_en: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: DataTypes.NOW,
        },
    }, {
        tableName: 'ubicaciones_activas',
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        schema: 'auth',
    });

    UbicacionesActivas.associate = (models) => {
        models.UbicacionesActivas.belongsTo(models.Usuarios, {
            foreignKey: 'usuario_id',
            targetKey: 'id',
            as: 'usuario',
        });
    };

    return UbicacionesActivas;
};