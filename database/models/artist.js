
var Artist = function(sequelize, DataTypes) {
    var Artist = sequelize.define('Artist', {	
	name: {
	    type:DataTypes.STRING,
	    allowNull:false,
	    unique:true,
	},
	mbid:{
	    type:DataTypes.STRING,
//	    unique:true,
	},
    }, {
	classMethods:{
	    associate:function(models) {
		Artist.hasMany(models.Album,{foreignKeyConstraint:true});
		Artist.hasMany(models.Track,{foreignKeyConstraint:true});
	    },
	}
	
    });
    return Artist;
};

module.exports = Artist;