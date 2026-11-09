export default (sequelize, DataTypes) => {
    const Localizacion = sequelize.define('Localizacion', {
        id_localizacion: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        id_fotografo: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
        },
        latitud: {
            type: DataTypes.DOUBLE,
            allowNull: false,
        },
        longitud: {
            type: DataTypes.DOUBLE,
            allowNull: false,
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
        fec_actualizacion: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: DataTypes.NOW,
        },
    }, {
        tableName: 'localizacion',
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        schema: 'fotografo',
    });

    Localizacion.associate = (models) => {
        models.Localizacion.belongsTo(models.Fotografos, {
            foreignKey: 'id_fotografo',
            targetKey: 'id',
            as: 'fotografo',
        });
    };

    return Localizacion;
};