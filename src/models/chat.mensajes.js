export default (sequelize, DataTypes) => {
    const Mensajes = sequelize.define('Mensajes', {
        id_mensaje: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        id_conversacion: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
        },
        emisor: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        contenido: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        fec_creacion: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        url_media: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        fec_lectura: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        tipo: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: 'text',
        },
        eliminado: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false,
        },
    }, {
        tableName: 'mensajes',
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        schema: 'chat',
    });

    Mensajes.associate = (models) => {
        models.Mensajes.belongsTo(models.Conversacion, {
            foreignKey: 'id_conversacion',
            targetKey: 'id_chat',
            as: 'conversacion',
        });
        models.Mensajes.belongsTo(models.Usuarios, {
            foreignKey: 'emisor',
            targetKey: 'id',
        });
        models.Mensajes.hasMany(models.Adjuntos, {
            foreignKey: 'id_mensaje',
            sourceKey: 'id_mensaje',
            as: 'adjuntos',
        });
    };

    return Mensajes;
};