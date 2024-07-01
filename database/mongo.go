package database

import (
	"context"
	"fmt"
	"os"
	"strconv"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.mongodb.org/mongo-driver/mongo/readpref"
)

type MongoDatabase struct{}

var client *mongo.Client
var mongodb *mongo.Database

func (s MongoDatabase) Start() error {
	fmt.Println("Opening MongoDB connection...")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	client, err := mongo.Connect(ctx, options.Client().ApplyURI(os.Getenv("MONGODB_CONNECT_URL")))
	if err != nil {
		return err
	}
	ctx, cancel = context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	err = client.Ping(ctx, readpref.Primary())
	if err != nil {
		return err
	}
	fmt.Println("Successfully opened MongoDB connection")
	mongodb = client.Database("pta-platform")
	// s.SavePta(ptaData[0])
	return nil
}

func (s MongoDatabase) Terminate() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := client.Disconnect(ctx); err != nil {
		panic(err)
	}
}

func (s MongoDatabase) SavePta(data PtaData) PtaData {
	collection := mongodb.Collection("ptas")
	id, err := objectIdFromHex(data.Id)
	if err != nil {
		objectId := primitive.NewObjectID()
		id = &objectId
	}
	data.Id = ""
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	result, err := collection.ReplaceOne(ctx, bson.D{{"_id", id}}, data, options.Replace().SetUpsert(true))
	if err != nil {
		panic(err)
	}
	if result.UpsertedID != nil {
		objectId, ok := result.UpsertedID.(primitive.ObjectID)
		if !ok {
			panic("UpsertedID is not an ObjectID: " + result.UpsertedID.(string))
		}
		data.Id = objectId.Hex()
	}
	return data
}

func (s MongoDatabase) LoadPta(id string) *PtaData {
	objectId, err := objectIdFromHex(id)
	if err != nil {
		panic(err)
	}
	collection := mongodb.Collection("ptas")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var result PtaData
	err = collection.FindOne(ctx, bson.D{{"_id", objectId}}).Decode(&result)
	if err != nil {
		fmt.Println(err)
		return nil
	}
	return &result
}

func (s MongoDatabase) DeletePta(id string) bool {
	objectId, err := objectIdFromHex(id)
	if err != nil {
		panic(err)
	}
	collection := mongodb.Collection("ptas")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err = collection.DeleteOne(ctx, bson.D{{"_id", objectId}})
	if err != nil {
		panic(err)
		return false
	}
	return true
}

func (s MongoDatabase) SearchPta(params map[string][]string) []PtaData {
	collection := mongodb.Collection("ptas")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.D{}
	for k, v := range params {
		// Is it a number?
		number, err := strconv.Atoi(v[0])
		if err == nil {
			filter = append(filter, bson.E{
				Key:   k,
				Value: number,
			})
			continue
		}
		// Is it a boolean?
		boolean, err := strconv.ParseBool(v[0])
		if err == nil {
			filter = append(filter, bson.E{
				Key:   k,
				Value: boolean,
			})
			continue
		}
		// Otherwise, it's a string
		filter = append(filter, bson.E{
			Key: k,
			Value: bson.D{
				{"$regex", "^" + v[0] + "$"},
				{"$options", "i"},
			}})
	}

	cursor, err := collection.Find(ctx, filter)
	if err != nil {
		panic(err)
	}
	defer cursor.Close(ctx)
	var result []PtaData
	err = cursor.All(ctx, &result)
	if err != nil {
		panic(err)
	}
	return result
}

func (s MongoDatabase) GetTools() []string {
	collection := mongodb.Collection("tools")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cursor, err := collection.Find(ctx, bson.D{})
	if err != nil {
		panic(err)
	}
	defer cursor.Close(ctx)
	var result []struct{ Name string }
	err = cursor.All(ctx, &result)
	if err != nil {
		panic(err)
	}
	var tools []string = make([]string, 0)
	for _, tool := range result {
		tools = append(tools, tool.Name)
	}
	return tools
}

func (s MongoDatabase) SetTools(tools []string) {
	collection := mongodb.Collection("tools")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err := collection.DeleteMany(ctx, bson.D{})
	if err != nil {
		panic(err)
	}
	var documents []interface{}
	for _, tool := range tools {
		documents = append(documents, bson.D{{"name", tool}})
	}
	_, err = collection.InsertMany(ctx, documents)
	if err != nil {
		panic(err)
	}
}

func (s MongoDatabase) GetTypes() []string {
	collection := mongodb.Collection("types")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cursor, err := collection.Find(ctx, bson.D{})
	if err != nil {
		panic(err)
	}
	defer cursor.Close(ctx)
	var result []struct{ Name string }
	err = cursor.All(ctx, &result)
	if err != nil {
		panic(err)
	}
	var types []string = make([]string, 0)
	for _, tool := range result {
		types = append(types, tool.Name)
	}
	return types
}

func (s MongoDatabase) SetTypes(types []string) {
	collection := mongodb.Collection("types")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err := collection.DeleteMany(ctx, bson.D{})
	if err != nil {
		panic(err)
	}
	var documents []interface{}
	for _, tool := range types {
		documents = append(documents, bson.D{{"name", tool}})
	}
	_, err = collection.InsertMany(ctx, documents)
	if err != nil {
		panic(err)
	}
}

func (s MongoDatabase) GetDurations() []int {
	collection := mongodb.Collection("durations")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cursor, err := collection.Find(ctx, bson.D{})
	if err != nil {
		panic(err)
	}
	defer cursor.Close(ctx)
	var result []struct{ Length int }
	err = cursor.All(ctx, &result)
	if err != nil {
		panic(err)
	}
	var durations = make([]int, 0)
	for _, duration := range result {
		durations = append(durations, duration.Length)
	}
	return durations
}

func (s MongoDatabase) SetDurations(durations []int) {
	collection := mongodb.Collection("durations")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err := collection.DeleteMany(ctx, bson.D{})
	if err != nil {
		panic(err)
	}
	var documents []interface{}
	for _, duration := range durations {
		documents = append(documents, bson.D{{"length", duration}})
	}
	_, err = collection.InsertMany(ctx, documents)
	if err != nil {
		panic(err)
	}
}

func (s MongoDatabase) GetPeriods() []Period {
	collection := mongodb.Collection("periods")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var result struct {
		Periods []Period `json:"periods" form:"periods"`
	}
	err := collection.FindOne(ctx, bson.M{"_id": "periods"}).Decode(&result)
	if err != nil {
		fmt.Println(err)
		return nil
	}
	var periods = make([]Period, 0)
	for _, period := range result.Periods {
		periods = append(periods, period)
	}
	return periods
}

func (s MongoDatabase) SetPeriods(periods []Period) {
	collection := mongodb.Collection("periods")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var periodStruct = struct {
		Periods []Period `json:"periods" form:"periods"`
	}{
		Periods: periods,
	}
	_, err := collection.ReplaceOne(ctx, bson.M{"_id": "periods"}, periodStruct, options.Replace().SetUpsert(true))
	if err != nil {
		panic(err)
	}
}

func (s MongoDatabase) GetSubjects() []Subject {
	collection := mongodb.Collection("subjects")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cursor, err := collection.Find(ctx, bson.D{})
	if err != nil {
		panic(err)
	}
	defer cursor.Close(ctx)
	var result = make([]Subject, 0)
	err = cursor.All(ctx, &result)
	if err != nil {
		panic(err)
	}
	return result
}

func (s MongoDatabase) SetSubjects(subjects []Subject) {
	collection := mongodb.Collection("subjects")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err := collection.DeleteMany(ctx, bson.D{})
	if err != nil {
		panic(err)
	}

	if len(subjects) == 0 {
		return
	}

	var documents []interface{}
	for _, subject := range subjects {
		documents = append(documents, subject)
	}
	_, err = collection.InsertMany(ctx, documents)
	if err != nil {
		panic(err)
	}
}

func (s MongoDatabase) GetUser(id string) *User {
	collection := mongodb.Collection("users")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var result User
	objectId, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		fmt.Println(err)
		return nil
	}
	err = collection.FindOne(ctx, bson.M{"_id": objectId}).Decode(&result)
	if err != nil {
		fmt.Println(err)
		return nil
	}
	return &result
}

func (s MongoDatabase) FindUsers(params map[string][]string) []User {
	collection := mongodb.Collection("users")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.D{}
	for k, v := range params {
		filter = append(filter, bson.E{
			Key: k,
			Value: bson.D{
				{"$regex", "^" + v[0] + "$"},
				{"$options", "i"},
			}})
	}

	var result []User
	cursor, err := collection.Find(ctx, filter)
	if err != nil {
		fmt.Println(err)
		return nil
	}
	err = cursor.All(ctx, &result)
	if err != nil {
		fmt.Println(err)
		return nil
	}
	return result
}

func (s MongoDatabase) SaveUser(user User) User {
	collection := mongodb.Collection("users")
	id, err := objectIdFromHex(user.Id)
	if err != nil {
		objectId := primitive.NewObjectID()
		id = &objectId
	}
	user.Id = ""
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	result, err := collection.ReplaceOne(ctx, bson.D{{"_id", id}}, user, options.Replace().SetUpsert(true))
	if err != nil {
		panic(err)
	}
	if result.UpsertedID != nil {
		objectId, ok := result.UpsertedID.(primitive.ObjectID)
		if !ok {
			panic("UpsertedID is not an ObjectID: " + result.UpsertedID.(string))
		}
		user.Id = objectId.Hex()
	}
	return user
}

func (s MongoDatabase) GetConfig() *Config {
	collection := mongodb.Collection("config")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var result Config
	err := collection.FindOne(ctx, bson.M{"_id": "config"}).Decode(&result)
	if err != nil {
		fmt.Println(err)
		return nil
	}
	return &result
}

func (s MongoDatabase) SetConfig(config Config) {
	collection := mongodb.Collection("config")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err := collection.ReplaceOne(ctx, bson.M{"_id": "config"}, config, options.Replace().SetUpsert(true))
	if err != nil {
		panic(err)
	}
}

func objectIdFromHex(hex string) (*primitive.ObjectID, error) {
	objectID, err := primitive.ObjectIDFromHex(hex)
	if err != nil {
		return nil, err
	}
	return &objectID, nil
}
