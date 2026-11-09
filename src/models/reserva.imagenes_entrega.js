export default (sequelize, DataTypes) => {
    const ImagenesEntrega = sequelize.define('ImagenesEntrega', {
        id_imagen: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        id_entrega: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
        },
        url_imagen: {
            type: DataTypes.STRING,
            allowNull: true,
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
            allowNull: true,
        },
        tamano: {
            type: DataTypes.BIGINT,
            allowNull: true,
        },
    }, {
        tableName: 'imagenes_entrega',
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        schema: 'reserva',
    });

    ImagenesEntrega.associate = (models) => {
        models.ImagenesEntrega.belongsTo(models.Entrega, {
            foreignKey: 'id_entrega',
            targetKey: 'id_entrega',
            as: 'entrega',
        });
    };

    return ImagenesEntrega;
};