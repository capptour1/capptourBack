export default (sequelize, DataTypes) => {
    const Sesiones = sequelize.define('Sesiones', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        id_usuario: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
        },
        token: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        proveedor: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'local',
        },
        dispositivo: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        ip: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        creado_en: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: DataTypes.NOW,
        },
        expira_en: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        activo: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: true,
        },
    }, {
        tableName: 'sesiones',
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        schema: 'auth',
    });

    Sesiones.associate = (models) => {
        models.Sesiones.belongsTo(models.Usuarios, {
            foreignKey: 'id_usuario',
            targetKey: 'id',
            as: 'usuario',
        });
    };

    return Sesiones;
};