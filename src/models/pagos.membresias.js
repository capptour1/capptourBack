export default (sequelize, DataTypes) => {
    const Membresias = sequelize.define('Membresias', {
        id_membresia: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        detalle: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        precio_en_cop: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        duracion_dias: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 30,
        },
        beneficios: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            allowNull: true,
            defaultValue: [],
        },
    }, {
        tableName: 'membresias',
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        schema: 'pagos',
    });

    Membresias.associate = (models) => {
        models.Membresias.hasMany(models.SuscripcionesUsuario, {
            foreignKey: 'membresia_id',
            sourceKey: 'id_membresia',
            as: 'suscripcionesUsuario',
        });
        models.Membresias.hasMany(models.TransaccionesWompi, {
            foreignKey: 'membresia_id',
            sourceKey: 'id_membresia',
            as: 'transaccionesWompi',
        });
    };

    return Membresias;
};