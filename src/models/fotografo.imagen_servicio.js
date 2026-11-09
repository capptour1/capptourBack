export default (sequelize, DataTypes) => {
    const ImagenServicio = sequelize.define('ImagenServicio', {
        id_imagen: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        id_servicio: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
        },
        fec_creacion: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        estado: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'A',
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
        tableName: 'imagen_servicio',
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        schema: 'fotografo',
    });

    ImagenServicio.associate = (models) => {
        models.ImagenServicio.belongsTo(models.Servicios, {
            foreignKey: 'id_servicio',
            targetKey: 'id_servicio',
            as: 'servicio',
        });
    };

    return ImagenServicio;
};