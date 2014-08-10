var Playlist = function(sequelize, DataTypes) {
    var Playlist = sequelize.define('Playlist', {	
	name: {
	    type:DataTypes.STRING,
	    allowNull:false,
	    unique:true
	}
    }, {
	classMethods:{
	    associate:function(models) {
		Playlist.hasMany(models.PlaylistItem, {as: "items", foreign_key:"foreign_key", foreignKeyConstraint:true});
	    },
	}
	
    });
    return Playlist;
};

module.exports = Playlist;
