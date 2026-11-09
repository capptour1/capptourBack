export default (sequelize, DataTypes) => {
    const ServicioCategoria = sequelize.define('ServicioCategoria', {
        id_servicio: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
        },
        id_categoria: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
        },
    }, {
        tableName: 'servicio_categoria',
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        schema: 'fotografo',
    });

    ServicioCategoria.associate = (models) => {
        models.ServicioCategoria.belongsTo(models.CategoriaServicio, {
            foreignKey: 'id_categoria',
            targetKey: 'id_categoria',
            as: 'categoriaServicio',
        });
        models.ServicioCategoria.belongsTo(models.Servicios, {
            foreignKey: 'id_servicio',
            targetKey: 'id_servicio',
            as: 'servicio',
        });
    };

    return ServicioCategoria;
};