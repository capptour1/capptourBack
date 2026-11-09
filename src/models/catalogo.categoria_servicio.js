export default (sequelize, DataTypes) => {
    const CategoriaServicio = sequelize.define('CategoriaServicio', {
        id_categoria: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        nombre: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        descripcion: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        icono: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        color: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        estado: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'A',
        },
        fec_creacion: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    }, {
        tableName: 'categoria_servicio',
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        schema: 'catalogo',
    });

    CategoriaServicio.associate = (models) => {
        models.CategoriaServicio.hasMany(models.ServicioCategoria, {
            foreignKey: 'id_categoria',
            sourceKey: 'id_categoria',
            as: 'serviciosCategoria',
        });
    };

    return CategoriaServicio;
};