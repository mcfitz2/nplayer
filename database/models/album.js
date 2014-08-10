
var Album = function(sequelize, DataTypes) {
    var Album = sequelize.define('Album', {	
	title:{
	    type:DataTypes.STRING,
	    allowNull:false,
	},
	mbid:{
	    type:DataTypes.STRING,
//	    unique:true,
	},
	year:{
	    type:DataTypes.INTEGER(4),
	    allowNull:false,
	    validate:{
		min:1900,
	    }
	},
	cover:DataTypes.BLOB
    }, {
	classMethods:{
	    associate:function(models) {
		Album.belongsTo(models.Artist, {foreignKeyConstraint:true});
		Album.hasMany(models.Track, {foreignKeyConstraint:true});
	    },
	}
	
    });
    return Album;
};

module.exports = Album;