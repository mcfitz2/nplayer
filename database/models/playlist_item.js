var PlaylistItem = function(sequelize, DataTypes) {
    var PlaylistItem = sequelize.define('PlaylistItem', {	
	index: {
	    type:DataTypes.INTEGER,
	}
    }, {
	classMethods:{
	    associate:function(models) {
		PlaylistItem.belongsTo(models.Playlist, {foreign_key:"foreign_key", foreignKeyConstraint:true});
		PlaylistItem.belongsTo(models.Track, {foreign_key:"foreign_key", foreignKeyConstraint:true});
	    },
	}
	
    });
    return PlaylistItem;
};

module.exports = PlaylistItem;
