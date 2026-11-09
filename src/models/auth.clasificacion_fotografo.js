export default (sequelize, DataTypes) => {
    const ClasificacionFotografo = sequelize.define('ClasificacionFotografo', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        detalle: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    }, {
        tableName: 'clasificacion_fotografo',
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        schema: 'auth',
    });

    return ClasificacionFotografo;
};