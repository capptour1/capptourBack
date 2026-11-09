export default (sequelize, DataTypes) => {
    const Paises = sequelize.define('Paises', {
        id_pais: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        nombre: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        iso_code: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        codigo_telefono: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        bandera_url: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        id_moneda: {
            type: DataTypes.INTEGER,
            allowNull: true,
            primaryKey: true,
        },
    }, {
        tableName: 'paises',
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        schema: 'public',
    });

    Paises.associate = (models) => {
        models.Paises.belongsTo(models.TipoMoneda, {
            foreignKey: 'id_moneda',
            targetKey: 'id_moneda',
            as: 'tipoMoneda',
        });
    };

    return Paises;
};