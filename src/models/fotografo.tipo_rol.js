export default (sequelize, DataTypes) => {
    const TipoRol = sequelize.define('TipoRol', {
        id_rol: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        descripcion: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        estado: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'A',
        },
    }, {
        tableName: 'tipo_rol',
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        schema: 'fotografo',
    });

    TipoRol.associate = (models) => {
        models.TipoRol.hasMany(models.Fotografos, {
            foreignKey: 'id_rol',
            sourceKey: 'id_rol',
            as: 'fotografos',
        });
    };

    return TipoRol;
};