var fs        = require('fs')
, path      = require('path')
, Sequelize = require('sequelize')
, lodash    = require('lodash')
, sequelize = new Sequelize("tracks", "micah", "cl0ser2g0d", {
    dialect:"sqlite", 
    storage: 'database.sqlite',
    logging:false
})
, db        = {};
 
fs
    .readdirSync(__dirname)
    .filter(function(file) {
	return (file.indexOf('.') !== 0) && (file !== 'index.js');
    })
    .forEach(function(file) {
	console.log("loading", file);
	var model = sequelize.import(path.join(__dirname, file));
	db[model.name] = model;
    });
 
Object.keys(db).forEach(function(modelName) {
    if ('associate' in db[modelName]) {
	db[modelName].associate(db);
    }
});
 
module.exports = lodash.extend({
    sequelize: sequelize,
    Sequelize: Sequelize
}, db);
