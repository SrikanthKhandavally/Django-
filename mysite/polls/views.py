from django.http import HttpResponse
from polls.models import Question
# Create your views here.

def index(request):

    return HttpResponse("Hello World it's Srikanth Sharma")
def detail(request, question_id):
    return HttpResponse("You are viewing question: %s" % question_id)
def vote(request, question_id):
    return  HttpResponse("You are voting question %s" % question_id)
def results(request, question_id):
    res = Question.objects.all()
    return res
   # return  HttpResponse("You are viewing results for question: %s" % question_id)

