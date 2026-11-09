export default (sequelize, DataTypes) => {
    const UsuarioTelefono = sequelize.define('UsuarioTelefono', {
        id_telefono: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        id_pais: {
            type: DataTypes.INTEGER,
            allowNull: true,
            primaryKey: true,
        },
        telefono: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        fecha_creacion: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        estado: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'A',
        },
        id_usuario: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
        },
    }, {
        tableName: 'usuario_telefono',
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        schema: 'auth',
    });

    UsuarioTelefono.associate = (models) => {
        models.UsuarioTelefono.belongsTo(models.Paises, {
            foreignKey: 'id_pais',
            targetKey: 'id_pais',
            as: 'pais',
        });
        models.UsuarioTelefono.belongsTo(models.Usuarios, {
            foreignKey: 'id_usuario',
            targetKey: 'id',
            as: 'usuario',
        });
    };

    return UsuarioTelefono;
};