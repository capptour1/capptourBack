export default (sequelize, DataTypes) => {
    const Entrega = sequelize.define('Entrega', {
        id_entrega: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        id_reserva: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
        },
        estado: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'A',
        },
        fec_creacion: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: DataTypes.NOW,
        },
        link_gdrive: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        link_icloud: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        link_airdrop: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        link_microsoft: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    }, {
        tableName: 'entrega',
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        schema: 'reserva',
    });

    Entrega.associate = (models) => {
        models.Entrega.belongsTo(models.Reserva, {
            foreignKey: 'id_reserva',
            targetKey: 'id_reserva',
            as: 'reserva',
        });
        models.Entrega.hasMany(models.ImagenesEntrega, {
            foreignKey: 'id_entrega',
            sourceKey: 'id_entrega',
            as: 'imagenesEntrega',
        });
    };

    return Entrega;
};