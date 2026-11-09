export default (sequelize, DataTypes) => {
    const TiposSolicitudes = sequelize.define('TiposSolicitudes', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        descripcion: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    }, {
        tableName: 'tipos_solicitudes',
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        schema: 'fotografo',
    });

    return TiposSolicitudes;
};