export default (sequelize, DataTypes) => {
    const Roles = sequelize.define('Roles', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        nombre: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    }, {
        tableName: 'roles',
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        schema: 'public',
    });

    return Roles;
};