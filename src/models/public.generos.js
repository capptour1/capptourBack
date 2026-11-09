export default (sequelize, DataTypes) => {
    const Generos = sequelize.define('Generos', {
        id_genero: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        descripcion: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    }, {
        tableName: 'generos',
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        schema: 'public',
    });

    return Generos;
};