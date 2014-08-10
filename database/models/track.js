var Track = function(sequelize, DataTypes) {
    var Track = sequelize.define('Track', {	

	path:{
	    type:DataTypes.TEXT,
	    unique:true,
	    allowNull:false,
	},
	title:{
	    type:DataTypes.STRING,
	    allowNull:false,
	    
	},
	duration:DataTypes.INTEGER,
	plays:DataTypes.INTEGER,
	mbid:DataTypes.STRING,
	AcoustId:DataTypes.STRING,
	bitrate:DataTypes.INTEGER(3),
	tracknumber:{
	    type:DataTypes.INTEGER,
	    allowNull:false,
	},
	discnumber:{
	    type:DataTypes.INTEGER,
	    allowNull:false,
	    defaultValue:1
	},
    }, {
	classMethods:{
	    associate:function(models) {
		Track.belongsTo(models.Artist, {foreignKeyConstraint:true});
		Track.belongsTo(models.Album, {foreignKeyConstraint:true});
	    },
	}
	
    });
    return Track;
};

module.exports = Track;
