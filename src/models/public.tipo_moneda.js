export default (sequelize, DataTypes) => {
    const TipoMoneda = sequelize.define('TipoMoneda', {
        id_moneda: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        codigo: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        nombre: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        simbolo: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        decimales: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            defaultValue: 2,
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
    }, {
        tableName: 'tipo_moneda',
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        schema: 'public',
    });

    TipoMoneda.associate = (models) => {
        models.TipoMoneda.hasMany(models.Paises, {
            foreignKey: 'id_moneda',
            sourceKey: 'id_moneda',
            as: 'paises',
        });
    };

    return TipoMoneda;
};