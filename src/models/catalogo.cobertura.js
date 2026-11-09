export default (sequelize, DataTypes) => {
    const Cobertura = sequelize.define('Cobertura', {
        id_cobertura: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        nombre: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        tipo: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        id_padre: {
            type: DataTypes.BIGINT,
            allowNull: true,
            primaryKey: true,
        },
        codigo_iso: {
            type: DataTypes.STRING,
            allowNull: true,
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
        tableName: 'cobertura',
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        schema: 'catalogo',
    });

    Cobertura.associate = (models) => {
        models.Cobertura.belongsTo(models.Cobertura, {
            foreignKey: 'id_padre',
            targetKey: 'id_cobertura',
            as: 'padre',
        });
        models.Cobertura.hasMany(models.Cobertura, {
            foreignKey: 'id_padre',
            sourceKey: 'id_cobertura',
            as: 'coberturasHijas',
        });
        models.Cobertura.hasMany(models.ServicioGlobalTarifa, {
            foreignKey: 'id_cobertura',
            sourceKey: 'id_cobertura',
            as: 'serviciosGlobalTarifa',
        });
    };

    return Cobertura;
};