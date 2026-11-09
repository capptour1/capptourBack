export default (sequelize, DataTypes) => {
    const TipoUsuario = sequelize.define('TipoUsuario', {
        id: {
            type: DataTypes.INTEGER,
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
    }, {
        tableName: 'tipo_usuario',
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        schema: 'auth',
    });

    TipoUsuario.associate = (models) => {
        models.TipoUsuario.hasMany(models.Usuarios, {
            foreignKey: 'tipo_usuario',
            sourceKey: 'id',
            as: 'usuarios',
        });
    };

    return TipoUsuario;
};