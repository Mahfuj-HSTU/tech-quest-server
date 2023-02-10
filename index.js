require( "dotenv" ).config();
const express = require( "express" );
const app = express();
const port = process.env.PORT || 8000;
const cors = require( "cors" );
const mongoose = require( 'mongoose' );
const multer = require( 'multer' );
const { MongoClient, ServerApiVersion, ObjectId, CURSOR_FLAGS } = require( "mongodb" );

const mediaController = require( './controllers/mediaController' )
const fs = require( 'fs' )
const path = require( 'path' )

const storage = multer.diskStorage( {
  destination: function ( req, file, cb ) {
    if ( fs.existsSync( 'public' ) ) {
      fs.mkdirSync( 'public' );
    }
    if ( fs.existsSync( 'public/videos' ) ) {
      fs.mkdirSync( 'public/videos' )
    }
    cb( null, "public/videos" );
  },
  filename: function ( req, file, cb ) {
    cb( null, Date.now() = file.originalname );
  },
} );

const upload = multer( {
  storage: storage,
  fileFilter: function ( req, file, cb ) {
    var ext = path.extname( file.originalname );
    if ( ext !== '.mkv' && ext !== '.mp4' ) {
      return cb( new Error( 'Only videos are allowed' ) )
    }
    cb( null, true );
  }
} )

// middleware
app.use( cors() );
app.use( express.json( { limit: "100mb" } ) );

const uri = `mongodb+srv://${ process.env.DB_USER }:${ process.env.DB_PASS }@cluster0.pl2ayam.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient( uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
} );


// mongoose connection
mongoose.set( 'strictQuery', true );
mongoose.connect( uri, {
  useNewUrlParser: true,
} );
mongoose.connection.on( 'connected', () => {
  console.log( 'Connected to mongodb' )
} )
mongoose.connection.on( 'error', ( err ) => {
  console.log( 'error connecting to mongodb', err )
} )


async function run () {
  try {
    const usersCollection = client.db( "techQuest" ).collection( "users" );
    const allJobsCollection = client.db( "techQuest" ).collection( "recruiterJobPosts" );
    const recruiterJobPostsCollection = client.db( "techQuest" ).collection( "recruiterJobPosts" );
    const applicationCollection = client.db( "techQuest" ).collection( "applications" );
    const jobSeekersCollection = client.db( "techQuest" ).collection( "jobSeekersCollection" );
    const courseCollection = client.db( "techQuest" ).collection( "courses" );
    const videoCollection = client.db( "techQuest" ).collection( "videos" );
    const test = client.db( "techQuest" ).collection( "test" ); // created by jayem for testing

    // Create post method for add job section
    app.post( "/alljobs", async ( req, res ) => {
      const jobPostDetails = req.body;
      const result = await allJobsCollection.insertOne( jobPostDetails );
      // console.log( result );
      res.send( result );
    } );

    // deleting job by id
    app.delete( "/delete-job/:id", async ( req, res ) => {
      const id = req.params.id;
      // console.log(id);
      const filter = { _id: ObjectId( id ) };
      const result = await recruiterJobPostsCollection.deleteOne( filter );
      res.send( result );
    } );

    // my jobs
    app.get( "/myjobs", async ( req, res ) => {
      const email = req.query.email;
      // console.log( email );
      const query = { email: email };
      const jobs = await applicationCollection.find( query ).toArray();
      // console.log( result );
      res.send( jobs );
    } );

    // all job seekers
    app.get( "/jobSeekersCollection", async ( req, res ) => {
      const query = { role: "jobSeeker" };
      const result = await usersCollection.find( query ).toArray();
      res.send( result );
    } );

    // storing job seekers application
    app.post( "/applications", async ( req, res ) => {
      const application = req.body;
      // console.log(application);
      const result = await applicationCollection.insertOne( application );
      // console.log(result);
      res.send( result );
    } );

    // created a search query - it is not complete
    app.get( "/search/:title", async ( req, res ) => {
      // const title = req.query;
      const title = req.params.title;
      // const country = req.params.country;
      //   console.log(title);
      const filter = { $search: { title } };
      const result = await recruiterJobPostsCollection
        .aggregate( [
          {
            $search: {
              index: "job_title",
              text: {
                query: title,
                path: {
                  wildcard: "*",
                },
              },
            },
          },
        ] )
        .toArray();
      res.send( result );
    } );

    // recruiter job posts
    app.get( "/recruiterJobPosts", async ( req, res ) => {
      const email = req.query.email;
      let query = {};
      if ( email ) {
        query = { recruiterEmail: email };
      }
      const result = await recruiterJobPostsCollection.find( query ).toArray();
      res.send( result );
    } );

    app.delete( "/recruiterJobPosts/:id", async ( req, res ) => {
      const id = req.params.id;
      const filter = { _id: ObjectId( id ) };
      const result = await recruiterJobPostsCollection.deleteOne( filter );
      res.send( result );
    } );

    // getting a specific job
    app.get( "/job-details/:id", async ( req, res ) => {
      const id = req.params.id;
      //   console.log( id );
      const filter = { _id: ObjectId( id ) };
      const result = await recruiterJobPostsCollection.findOne( filter );
      //   console.log( result );
      res.send( result );
    } );

    // storing job seekers application
    app.post( "/applications", async ( req, res ) => {
      const application = req.body;
      const result = await applicationCollection.insertOne( application );
      res.send( result );
    } );

    // app.get( "/jwt", async ( req, res ) => {
    //   const email = req.query.email;
    //   console.log( email );
    //   const query = { email: email };
    //   const user = await usersCollection.findOne( query );
    //   if ( user ) {
    //     const token = jwt.sign( { email }, process.env.ACCESS_TOKEN );
    //     return res.send( { accessToken: token } );
    //   }
    //   console.log( user );
    //   res.status( 401 ).send( { accessToken: "" } );
    // } );

    // post users
    app.post( "/users", async ( req, res ) => {
      const user = req.body;
      const result = await usersCollection.insertOne( user );
      res.send( result );
    } );

    // get all users
    app.get( "/users", async ( req, res ) => {
      const users = await usersCollection.find( {} ).toArray();
      res.send( users );
    } );

    // getting user to check role
    app.get( "/users/:email", async ( req, res ) => {
      const email = req.params.email;
      const query = { email };
      // console.log( email );
      // console.log( query );
      const user = await usersCollection.findOne( query );
      // console.log( user )
      res.send( user );
    } );

    // getting all application from db
    app.get( "/applications", async ( req, res ) => {
      const result = await applicationCollection.find( {} ).toArray();
      res.send( result );
    } );

    // storing a new course
    app.post( "/add-course/:title/:desc/:instructor/:img/:price",
      async ( req, res ) => {
        const title = req.params.title;
        const description = req.params.desc;
        const instructor = req.params.instructor;
        const img = req.params.img;
        const price = req.params.price;
        const courseInfo = { title, desc: description, instructor, img, price };
        const result = await courseCollection.insertOne( courseInfo );
        // console.log(result);
        res.send( result )
      }
    );

    // getting all courses
    app.get( "/courses", async ( req, res ) => {
      const courses = await courseCollection.find( {} ).toArray();
      // console.log( courses )
      res.send( courses );
    } );

    // getting a single course by id
    app.get( "/courses/:id", async ( req, res ) => {
      const id = req.params.id;
      const filter = { _id: ObjectId( id ) };
      const result = await courseCollection.findOne( filter );
      // const result = await test.findOne(filter);
      res.send( result );
    } );

    // storing payment info including course details and buyer email
    app.post( "/courses/payment/:id/:email", async ( req, res ) => {
      const email = req.params.email;
      const id = req.params.id;
      const filter = { _id: ObjectId( id ) };
      const courseInfo = await courseCollection.findOne( filter );
      const courseInfoMore = { ...courseInfo, email };
      const coursePayment = await coursePaymentCollection.insertOne(
        courseInfoMore
      );
      // console.log(courseInfoMore);
      res.send( coursePayment );
    } );

    // delete a course from course collection by admin
    app.delete( "/delete-course/:id", async ( req, res ) => {
      const id = req.params.id;
      const filter = { _id: ObjectId( id ) };
      const result = await courseCollection.deleteOne( filter );
      // const result = await test.deleteOne(filter);
      res.send( result );
    } )

    // post video
    app.post( '/videos', upload.fields( [ { name: 'videos', maxCount: 5, } ] ), async ( req, res ) => {
      const { name } = req.body;
      let videosPath = [];
      if ( Array.isArray( req.files.videos ) && req.files.videos.length > 0 ) {
        for ( let video of req.files.videos ) {
          videosPath.push( '/' + video.path )
        }
      }
      try {
        const createMedia = await Media.Create( {
          name,
          videos: videosPath
        } )
        res.json( { message: "Media created successfully", createMedia } )
      } catch ( error ) {
        console.log( error )
        res.status( 400 ).json( error )
      }
    } );

    // get video
    // app.get( "/videos", async ( req, res ) => {
    //   const video = await videoCollection.find( {} ).toArray()
    //   res.send( video );
    // } );
    app.get( '/videos', mediaController.getAll )

    // getting a video by id
    app.get( "/videos/:id", async ( req, res ) => {
      const id = req.params.id;
      const filter = { _id: ObjectId( id ) }
      const result = await videoCollection.findOne( filter );
      res.send( result );
    } );


  } catch {
    ( e ) => {
      console.error( "error inside run function: ", e );
    };
  }
}

run().catch( ( e ) => console.error( "run function error..", e ) );

app.get( "/", ( req, res ) => {
  res.send( "Tech Quest server is running..." );
} );

app.listen( port, () => {
  console.log( `Tech Quest server is running on ${ port }` );
} );
