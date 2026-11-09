export default (sequelize, DataTypes) => {
    const TipoExperiencia = sequelize.define('TipoExperiencia', {
        id_experiencia: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        descripcion: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    }, {
        tableName: 'tipo_experiencia',
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        schema: 'fotografo',
    });

    TipoExperiencia.associate = (models) => {
        models.TipoExperiencia.hasMany(models.Fotografos, {
            foreignKey: 'id_experiencia',
            sourceKey: 'id_experiencia',
            as: 'fotografos',
        });
    };

    return TipoExperiencia;
};