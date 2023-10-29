// To run all the queries

import { initializeConfig } from "../db_connetor";
import Activity, { ActivityDoc } from "../models/activityModel";
import TrackPoint, { TrackPointDoc } from "../models/trackPointModel";
import User, { UserDoc } from "../models/userModel";

initializeConfig()

async function queryOne() {
    const users: number = await User.count()
    const activities: number = await Activity.count()
    const trackPoints: number = await TrackPoint.count()

    return console.log(`Users: ${users},\nActivities: ${activities},\nTrackPoints: ${trackPoints}`)
}

//queryOne()

async function queryTwo() {
    const result = await Activity.aggregate([
    {
        $group: {
            _id: '$user_id',
            count: { $sum: 1 }
        }
    },
    {
        $group: {
            _id: null,
            totalActivities: { $sum: '$count' },
            totalUsers: { $sum: 1 }
        }
    },
    {
        $project: {
            averageActivity: { $divide: ['$totalActivities', '$totalUsers'] }
        }
    }
    ]);
  
    if (result.length > 0) {
        return console.log(`The average activity per user: ${result[0].averageActivity}`)
    } 
    else {
        return 0; // No activities found, return 0
    }
}

//queryTwo()

async function queryThree() {
    const top20Users = await User.aggregate([
        {
          $project: {
            user_id: '$_id',
            activityCount: { $size: '$activity_ids' },
            _id: 0
          }
        },
        {
          $sort: { activityCount: -1 }
        },
        {
          $limit: 20
        }
      ]);
  
    return top20Users
}

/*queryThree().then((top20Users) => {
    console.log('Top 20 users with most activities:');
    top20Users.forEach((user) => {
      console.log(`User ID: ${user.user_id}, Activity Count: ${user.activityCount}`);
    });
})*/

async function queryFour() {
    const activity = await Activity.find({ 'transportation_mode': 'taxi' }).exec()

    const activityId = activity.map((a) => a._id)
   
    const taxiTakers: UserDoc[] = await User.find({ activity_ids: { $in: activityId }}).exec()
    
    return taxiTakers.map((t) => t._id.toString());
}

/*queryFour().then((taxiTakers) => {
    console.log(`Those who has taken taxi is: `)
    taxiTakers.forEach((taker) => {
        console.log(`User ID: ${taker}`)
    })
})*/


async function queryFive() {
    const transportMode = await Activity.aggregate([
        {
          $match: {
            transportation_mode: { $ne: null } 
          }
        },
        {
          $group: {
            _id: '$transportation_mode',
            count: { $sum: 1 }
          }
        },
        {
          $sort: {
            _id: 1 
          }
        }
      ]);
  
    return transportMode
}

/*queryFive().then((transportMode) => {
    console.log("The kind of transportMode and counts: ")
    transportMode.forEach((transport) => {
      console.log(`Transport type: ${transport._id}, Count: ${transport.count}`);
    })
})*/

async function querySixA() {
    const theYearOfActivity = await Activity.aggregate([
        {
          $group: {
            _id: { $year: '$start_date_time' },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        },
        {
          $limit: 1
        }
      ]);
    console.log(`The year with the most activity: ${theYearOfActivity[0]._id}`);
      
    return theYearOfActivity[0]._id
    }

//querySixA()

async function querySixB() {
    const year = await querySixA()
    
    const resultActivities = await Activity.aggregate([
        {
          $match: {
            $expr: { $eq: [{ $year: '$start_date_time' }, year] }
          }
        },
        {
          $group: {
            _id: null,
            totalHours: { $sum: { $divide: [{ $subtract: ['$end_date_time', '$start_date_time'] }, 3600000] } }
          }
        }
      ]);
  
      const totalHours = resultActivities.length > 0 ? resultActivities[0].totalHours : 0;
  
      const resultYears = await Activity.aggregate([
        {
          $group: {
            _id: { $year: '$start_date_time' },
            totalHours: { $sum: { $divide: [{ $subtract: ['$end_date_time', '$start_date_time'] }, 3600000] } }
          }
        },
        {
          $sort: { totalHours: -1 }
        },
        {
          $limit: 1
        }
    ]);
  
    const yearWithMostHours = resultYears[0]._id;
  
    return console.log(`Is the year with mos activities the year with most hours? ${year === yearWithMostHours}`);
}

//querySixB()

// Help function to calculate distance in KM
async function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  }

async function querySeven() {
    const userId = "112"
    const user: UserDoc | null = await User.findById({ "_id": userId })
    if (user === null) {
        return 0
    }
    const activities = await Activity.find({
        _id: { $in: user.activity_ids },
        start_date_time: {
          $gte: new Date('2008-01-01'),
          $lt: new Date('2009-01-01')
        },
        trackpoint_ids: { $exists: true, $ne: [] }
      });
  
      let totalDistance = 0;
  
      for (const activity of activities) {
        const trackpoints = await TrackPoint.find({
          _id: { $in: activity.trackpoint_ids }
        });
  
        for (let i = 0; i < trackpoints.length - 1; i++) {
          const lat1 = trackpoints[i].lat;
          const lon1 = trackpoints[i].lon;
          const lat2 = trackpoints[i + 1].lat;
          const lon2 = trackpoints[i + 1].lon;
  
          totalDistance += await calculateDistance(lat1, lon1, lat2, lon2);
        }
      }
  
    return console.log(`How long can 112 walk in one year: ${totalDistance}`);
}

//querySeven()

function calculateAltitudeGain(trackpoints: TrackPointDoc[]) {
    const altutudeList: number[] = trackpoints.map((t) => t.altitude)
    let altitude = 0
    
    for (let i = 1; i < altutudeList.length; i++) {
        if(altutudeList[i] > altutudeList[i-1]){
            altitude += altutudeList[i] - altutudeList[i-1]
        }
    }

    return altitude
}

async function getAltitude(activities: ActivityDoc[]) {
    let altGain = 0

    for(const activiy of activities) {
        const gains: number = await TrackPoint.find({ '_id':  { $in: activiy.trackpoint_ids }, 'altitude': { $ne: -777 }}).exec()
            .then((tp: TrackPointDoc[]) => calculateAltitudeGain(tp))
        altGain += gains
    }    
    return altGain
}

async function getClimbers(users: UserDoc[]) {
    const climbers: Climber[] = []
    for (const user of users ){
        const totaltAltitudeGain: number = await Activity.find({ '_id': {$in: user.activity_ids}}).exec()
            .then(async (acts: ActivityDoc[]) => await getAltitude(acts))
        
        if(totaltAltitudeGain !== 0){
        climbers.push({
            user_id: user._id, 
            altitude: totaltAltitudeGain})
        }  
    }

    console.log(climbers)
    return climbers
}

interface Climber {
    user_id: string, 
    altitude: number
}

async function queryEight() {
    const climbers: Climber[] = await User.find({ activity_ids: { $not: { $size: 0}} }).exec().then(async (users: UserDoc[]) => {
        return await getClimbers(users)
    })

    climbers.sort((a, b) => a.altitude - b.altitude)

    return climbers.slice(0, 19)
}

/*queryEight().then((climbers) => {
    console.log("The top 20 climbers is: ");
    climbers.forEach((climber) => {
        console.log(`User ID: ${climber.user_id} and the altitude: ${climber.altitude}`)
    })
})*/


function calculateInvalid(trackpoints: TrackPointDoc[]) {
    const dateList: Date[] = trackpoints.map((t) => t.date)
    
    for (let i = 1; i < dateList.length; i++) {
        if(dateList[i].getTime() - 300000 > dateList[i-1].getTime()) {
            return true   
        }
    }
    
    return false
}

async function getInvalid(activities: ActivityDoc[]) {
    let totalInvalid: number = 0

    for(const activiy of activities) {
        if(activiy.trackpoint_ids.length > 1) {
            const invalid: boolean = await TrackPoint.find({ '_id':  { $in: activiy.trackpoint_ids }}).sort({ date: 1 }).exec()
                .then((tp: TrackPointDoc[]) => calculateInvalid(tp))
            if(invalid){
                totalInvalid += 1
            }
        }
    }    
    return totalInvalid
}



async function getOverShooters(users: UserDoc[]) {
    const overShooters: overShooter[] = []

    for (const user of users) {
        const invalidActivityCount = await Activity.find({ '_id': { $in: user.activity_ids }, "trackpoint_ids": { $not: {$size: 0}}})
            .then(async (activities:ActivityDoc[]) => {
                return await getInvalid(activities)
            })
        if(invalidActivityCount !== 0) {
            overShooters.push({
                user_id: user._id,
                invalidActivities: invalidActivityCount
            })
        }
    }

    return overShooters;
}

interface overShooter {
    user_id: string,
    invalidActivities: number
}

async function queryNine() {

    const overShooters: overShooter[] = await User.find({ activity_ids: { $not: { $size: 0}} }).exec().then(async (users: UserDoc[]) => {
        return await getOverShooters(users)
    })

    return overShooters
}
    
/*queryNine().then(overShooters => {
    console.log('Users with invalid activities:');
    overShooters.forEach((shooter) => {
        console.log(`User ID: ${shooter.user_id}, Invalid Activity Count: ${shooter.invalidActivities}`);
    });
});*/

async function wereTheyThere(activities: ActivityDoc[]) {
    const forbiddenCityLat = 39.916;
    const forbiddenCityLon = 116.397;
    let wereTheyThere: boolean = false

    for (const active of activities){
        await TrackPoint.find({'_id': { $in: active.trackpoint_ids }, 'lat': {$gte: forbiddenCityLat - 1, $lte: forbiddenCityLat + 1}, 'lon': {$gte: forbiddenCityLon - 0.1, $lte: forbiddenCityLon + 0.1} }).exec()
            .then((tp: TrackPointDoc[]) => {
                if(tp.length > 0) {
                    wereTheyThere = true
                    return wereTheyThere
                }
            })
    }
    return wereTheyThere
}

async function findForbiddenUsers(users: UserDoc[]) {
    const userList: string[] = []
    for (const user of users) {
        const inTheRoomWhereItHappens: boolean = await Activity.find({ '_id': { $in: user.activity_ids }, trackpoint_ids: {$not: {$size: 0}}}).exec()
            .then(async (activities: ActivityDoc[]) => {
                return await wereTheyThere(activities)
            })
        if(inTheRoomWhereItHappens) {
            userList.push(user._id.toString())
        }
    }
    return userList
}

async function queryTen() {
    const userlist: string[] = await User.find({ activity_ids: {$not: {$size: 0}}}).exec()
        .then(async (users: UserDoc[]) => {
            return await findForbiddenUsers(users)
    })

    return userlist
}

queryTen().then((userList) => {
    console.log("Who was in The Forbidden City?")
    console.log("These where: ")
    userList.forEach((user) => {
        console.log(`User ID: ${user}`)
    })
})

interface goodNoodle {
    user_id: string,
    transportation_mode: string
}

async function queryEleven() {
    const users: UserDoc[] = await User.find({ "has_labels": true}).exec();
    const goodNoodles: goodNoodle[] = []

    for (const user of users){
        
        const activities: ActivityDoc[] = await Activity.find({'_id': user.activity_ids, transportation_mode: { $exists: true }}).exec() 
        const transports: string[] = activities.map((a) => a.transportation_mode!) 
        const count = new Map<string, number>()
        if(transports.length > 0) {
            for (const transport of transports) {
                count.set(transport, (count.get(transport) || 0) + 1)
            }

            let maxValue = {
                transport: "",
                value: -1
            };
            for (var [key, value] of count) {
                if (maxValue.value < value) {
                    maxValue.transport = key
                    maxValue.value = value
                }
            }
            goodNoodles.push({
                user_id: user._id,
                transportation_mode: maxValue.transport
            })}
    }

    return goodNoodles;
}

/*queryEleven().then((goodNoodles) => {
    console.log("Users with their most used labels: ")
    goodNoodles.forEach((noodle) => {
        console.log(`User ID: ${noodle.user_id} and most used: ${noodle.transportation_mode}`)
    })
})
*/

