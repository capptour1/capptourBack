export default (sequelize, DataTypes) => {
    const Adjuntos = sequelize.define('Adjuntos', {
        id_adjunto: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        id_mensaje: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
        },
        url: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        url_thumbnail: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        nombre: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        mime_type: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        tamano: {
            type: DataTypes.BIGINT,
            allowNull: true,
        },
        fec_creacion: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: DataTypes.NOW,
        },
    }, {
        tableName: 'adjuntos',
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        schema: 'chat',
    });

    Adjuntos.associate = (models) => {
        models.Adjuntos.belongsTo(models.Mensajes, {
            foreignKey: 'id_mensaje',
            targetKey: 'id_mensaje',
            as: 'mensaje',
        });
    };

    return Adjuntos;
};