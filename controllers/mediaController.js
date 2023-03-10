const Media = require( "../Models/Media" )

exports.getAll = async ( req, res ) => {
    try {
        const media = await Media.find();
        res.json( media );
    }
    catch ( error ) {
        console.log( error );
        res.status( 400 ).json( error )
    }
}
