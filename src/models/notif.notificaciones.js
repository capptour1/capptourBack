export default (sequelize, DataTypes) => {
    const Notificaciones = sequelize.define('Notificaciones', {
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
        tipo: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'system',
        },
        titulo: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        mensaje: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        payload: {
            type: DataTypes.JSONB,
            allowNull: true,
        },
        leida: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        fec_creacion: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        fec_lectura: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    }, {
        tableName: 'notificaciones',
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        schema: 'notif',
    });

    Notificaciones.associate = (models) => {
        models.Notificaciones.belongsTo(models.Usuarios, {
            foreignKey: 'id_usuario',
            targetKey: 'id',
            as: 'usuario',
        });
    };

    return Notificaciones;
};