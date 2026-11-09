export default (sequelize, DataTypes) => {
    const FotoCalificacion = sequelize.define('FotoCalificacion', {
        id_calificacion: {
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
        puntualidad: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
        },
        calidad: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
        },
        profesionalismo: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
        },
        relacion: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
        },
        recomendacion: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
        },
        comentario: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    }, {
        tableName: 'foto_calificacion',
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        schema: 'fotografo',
    });

    FotoCalificacion.associate = (models) => {
        models.FotoCalificacion.belongsTo(models.Reserva, {
            foreignKey: 'id_reserva',
            targetKey: 'id_reserva',
            as: 'reserva',
        });
    };

    return FotoCalificacion;
};