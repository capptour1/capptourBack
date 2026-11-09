export default (sequelize, DataTypes) => {
    const Conversacion = sequelize.define('Conversacion', {
        id_chat: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        fec_creacion: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        tipo: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 1,
        },
        id_reserva: {
            type: DataTypes.BIGINT,
            allowNull: true,
            primaryKey: true,
        },
        fec_update: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        id_cliente: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
        },
        id_fotografo: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
        },
        oculto_fotografo: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false,
        },
        oculto_cliente: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false,
        },
        fecha_oculto_cliente: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        fecha_oculto_fotografo: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    }, {
        tableName: 'conversacion',
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        schema: 'chat',
    });

    Conversacion.associate = (models) => {
        models.Conversacion.belongsTo(models.Fotografos, {
            foreignKey: 'id_fotografo',
            targetKey: 'id',
            as: 'fotografo',
        });
        models.Conversacion.belongsTo(models.Usuarios, {
            foreignKey: 'id_cliente',
            targetKey: 'id',
            as: 'cliente',
        });
        models.Conversacion.hasMany(models.Mensajes, {
            foreignKey: 'id_conversacion',
            sourceKey: 'id_chat',
            as: 'mensajes',
        });
    };

    return Conversacion;
};